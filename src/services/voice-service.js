// VoiceService: OPTIONAL voice layer for the portfolio assistant.
//
// Conversation-session design (no AI dependency — transcripts flow through
// the same assistant engine as typed text):
//   IDLE -> LISTENING -> PROCESSING -> RESPONDING -> LISTENING -> ...
//   user stop -> STOPPED | unrecoverable mic error -> STOPPED
//   transient error -> ERROR -> back to LISTENING (session) or IDLE
//
// Safety properties (all preserved from the original implementation):
//   - never two simultaneous requests / recognitions / TTS streams
//   - dedupes duplicate recognition transcripts
//   - microphone stays paused while the assistant speaks (no feedback loop);
//     listening resumes only after TTS ends and only inside an active session
//   - every async callback is guarded by a session token (no resurrection
//     after endSession/dispose, no races between overlapping events)
//   - stopSynthesis() is always safe to call
//   - chat text is never modified; only the spoken copy is sanitized
//
// If any browser API is missing this module becomes a safe no-op.

import { detectLanguage, preprocessQuery } from './text-utils.js'

export const VState = Object.freeze({
  IDLE: 'idle',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  RESPONDING: 'responding',
  STOPPED: 'stopped',
  ERROR: 'error',
})

const DEDUPE_WINDOW_MS = 1800
const SILENCE_MS = 2600

// Conservative, human-paced speech settings (Arabic-friendly).
const TTS_RATE = 0.95
const TTS_PITCH = 1
const TTS_VOLUME = 1

// Recognition errors that mean "do not retry automatically" (permission or
// hardware problems). Anything else is treated as transient.
const FATAL_RECOGNITION_ERRORS = new Set([
  'not-allowed',
  'service-not-allowed',
  'audio-capture',
])

function isArabic(text) {
  return detectLanguage(text) === 'ar'
}

function speechRecognitionAvailable() {
  const w = typeof window !== 'undefined' ? window : null
  return Boolean(w && (w.SpeechRecognition || w.webkitSpeechRecognition))
}

function speechSynthesisAvailable() {
  const w = typeof window !== 'undefined' ? window : null
  return Boolean(w && w.speechSynthesis && w.speechSynthesis.speak)
}

// Matches emoji, pictographs, symbols, flags, dingbats, arrows and the
// zero-width joiner / variation selectors used to compose them.
const EMOJI_RX =
  /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}\u{200D}\u{2190}-\u{21FF}\u{2300}-\u{23FF}]/gu

const URL_RX = /(?:https?:\/\/|www\.)[^\s<>"')]+/gi
const FENCE_RX = /```[\s\S]*?```/g
const MARKDOWN_RX = /(\*\*|__)(.*?)\1|^\s{0,3}#{1,6}\s?|`([^`]*)`|\[([^\]]*)\]\([^)]*\)/gm
const DECORATIVE_RX = /[•◆▪▫★☆✦✧─│━▶◀✔✖♻©®™§¶†‡]/g

/**
 * Builds the spoken copy of a chat answer. The chat text itself is never
 * touched — only this TTS copy is cleaned:
 * - emojis/symbols are removed (never read aloud)
 * - markdown fences/bold/headers/links collapse to plain readable text
 * - raw http(s)/www URLs are dropped (emails are kept: contact info matters)
 * - decorative bullets become pauses so lists still sound structured
 *
 * Example: "أكيد 😊 شيماء عندها خبرة! 📱✨" -> "أكيد، شيماء عندها خبرة."
 */
export function prepareTextForSpeech(text) {
  let out = String(text || '')
  out = out.replace(FENCE_RX, ' ')
  out = out.replace(MARKDOWN_RX, (...args) => args[2] || args[3] || args[4] || '')
  out = out.replace(URL_RX, ' ')
  out = out.replace(EMOJI_RX, '')
  out = out.replace(DECORATIVE_RX, '، ')
  out = out.replace(/[ \t\u00A0]+/g, ' ')
  out = out.replace(/\n{3,}/g, '\n\n')
  out = out
    .split('\n')
    .map((line) => line.trim().replace(/^[،,;:\s]+|[،,;:\s]+$/g, ''))
    .filter(Boolean)
    .join('\n')
  return out.trim()
}

// Voice list is read live on every pick (getVoices is a cheap sync getter,
// and voices often arrive after page load — caching would go stale).
// Null-safe when the API is absent.
function readVoices() {
  try {
    if (!speechSynthesisAvailable()) return []
    const list = window.speechSynthesis.getVoices
      ? window.speechSynthesis.getVoices()
      : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

/**
 * Picks the best available voice for a language tag, or null to let the
 * browser choose its default. Arabic preference: ar-EG, then any ar-SA,
 * then any Arabic voice. Resilient: never throws, never assumes a voice
 * exists. Exported for tests.
 */
export function pickVoice(langTag) {
  const voices = readVoices()
  if (voices.length === 0) return null
  const wantAr = String(langTag || '').toLowerCase().startsWith('ar')
  if (wantAr) {
    const lower = (v) => String(v.lang || '').toLowerCase()
    return (
      voices.find((v) => lower(v) === 'ar-eg') ||
      voices.find((v) => lower(v).startsWith('ar-eg')) ||
      voices.find((v) => lower(v) === 'ar-sa') ||
      voices.find((v) => lower(v).startsWith('ar')) ||
      voices[0] ||
      null
    )
  }
  const lower = (v) => String(v.lang || '').toLowerCase()
  return (
    voices.find((v) => lower(v) === 'en-us') ||
    voices.find((v) => lower(v).startsWith('en')) ||
    voices[0] ||
    null
  )
}

export function createVoiceService({ onTranscript, onStateChange }) {
  const state = { current: VState.IDLE }

  let recognition = null
  let recognizing = false
  let disposed = false
  let sessionActive = false
  let sessionToken = 0
  let silenceTimer = null
  let lastFinal = null
  let lastFinalAt = 0
  let busyWithSpeech = false
  let currentUtterance = null

  function setState(s) {
    if (disposed || state.current === s) return
    state.current = s
    if (onStateChange) onStateChange(s)
  }

  function clearSilenceTimer() {
    if (silenceTimer) {
      clearTimeout(silenceTimer)
      silenceTimer = null
    }
  }

  function stopSynthesis() {
    currentUtterance = null
    if (!speechSynthesisAvailable()) {
      busyWithSpeech = false
      return
    }
    try {
      window.speechSynthesis.cancel()
    } catch {
      /* ignore */
    }
    busyWithSpeech = false
  }

  function stopRecognition() {
    recognizing = false
    clearSilenceTimer()
    try {
      if (recognition) recognition.stop()
    } catch {
      /* ignore */
    }
  }

  function handleFinal(transcript) {
    const text = (transcript || '').trim()
    if (!text || disposed) return

    const now = Date.now()
    if (lastFinal === text && now - lastFinalAt < DEDUPE_WINDOW_MS) {
      // duplicate transcript -> ignore
      return
    }
    lastFinal = text
    lastFinalAt = now

    // If we're mid-request, don't start another.
    if (state.current === VState.PROCESSING || state.current === VState.RESPONDING) {
      return
    }

    stopRecognition()
    stopSynthesis()
    setState(VState.PROCESSING)
    if (onTranscript) onTranscript(text)
  }

  function startRecognition(lang) {
    if (!speechRecognitionAvailable() || disposed) return false
    if (!sessionActive) return false
    if (state.current === VState.PROCESSING || state.current === VState.RESPONDING) return false
    if (busyWithSpeech) {
      stopSynthesis()
    }

    const token = sessionToken
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    // Single recognition instance for the service lifetime (no duplicates).
    if (!recognition) {
      recognition = new SR()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.maxAlternatives = 1

      recognition.onresult = (event) => {
        if (disposed || token !== sessionToken) return
        let interim = ''
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i]
          if (res.isFinal) finalTranscript += res[0].transcript
          else interim += res[0].transcript
        }
        // silence-based finalization
        clearSilenceTimer()
        if (interim) {
          silenceTimer = setTimeout(() => {
            if (token === sessionToken) handleFinal(interim)
          }, SILENCE_MS)
        }
        if (finalTranscript) handleFinal(finalTranscript)
      }

      recognition.onend = () => {
        recognizing = false
        clearSilenceTimer()
        if (disposed || token !== sessionToken) return
        // Auto-restart only inside a live listening state: never resurrect
        // after endSession/dispose, and never while speaking (feedback loop).
        if (sessionActive && state.current === VState.LISTENING && !busyWithSpeech) {
          try {
            recognition.start()
            recognizing = true
          } catch {
            /* ignore */
          }
        }
      }

      recognition.onerror = (event) => {
        recognizing = false
        clearSilenceTimer()
        if (disposed || token !== sessionToken) return
        const kind = event && event.error ? String(event.error) : ''
        if (FATAL_RECOGNITION_ERRORS.has(kind)) {
          // Permission/hardware failure: end the session, do not loop.
          endSession()
          return
        }
        // Transient error: surface ERROR, then recover.
        setState(VState.ERROR)
        if (sessionActive) {
          try {
            recognition.start()
            recognizing = true
            setState(VState.LISTENING)
          } catch {
            setState(VState.IDLE)
          }
        } else {
          setState(VState.IDLE)
        }
      }
    }
    try {
      recognition.lang = lang === 'ar' ? 'ar-EG' : 'en-US'
    } catch {
      /* ignore */
    }

    try {
      recognition.start()
      recognizing = true
      setState(VState.LISTENING)
      return true
    } catch {
      setState(VState.IDLE)
      return false
    }
  }

  function startSession(lang) {
    if (!speechRecognitionAvailable() || disposed) {
      setState(VState.IDLE)
      return false
    }
    if (sessionActive && (state.current === VState.LISTENING || state.current === VState.RESPONDING || state.current === VState.PROCESSING)) {
      return true // already in a live session
    }
    sessionActive = true
    sessionToken += 1
    return startRecognition(lang === 'en' ? 'en' : 'ar')
  }

  function endSession() {
    sessionToken += 1 // invalidate every pending callback/timer
    sessionActive = false
    stopRecognition()
    stopSynthesis()
    setState(VState.STOPPED)
  }

  return {
    /** Begins a continuous voice session (mic stays live across turns). */
    startSession(lang) {
      return startSession(typeof lang === 'string' ? lang : 'ar')
    },

    /** One-shot listen (kept for backward compatibility). */
    listen() {
      if (!speechRecognitionAvailable()) {
        setState(VState.IDLE)
        return false
      }
      if (disposed) return false
      if (state.current !== VState.IDLE && state.current !== VState.STOPPED && state.current !== VState.ERROR) {
        return false
      }
      return startSession('ar') // default to Arabic; refined per transcript
    },

    stopListening() {
      recognizing = false
      clearSilenceTimer()
      try {
        if (recognition) recognition.stop()
      } catch {
        /* ignore */
      }
      if (!sessionActive) setState(VState.IDLE)
    },

    /**
     * Interrupts the current speech immediately (Stop button). The TTS queue
     * is cancelled and nothing more is read. Inside a live session the mic
     * resumes listening; otherwise we go back to IDLE.
     * Returns true when live speech was actually interrupted.
     */
    interrupt() {
      const wasSpeaking = busyWithSpeech
      const token = sessionToken
      stopSynthesis()
      if (disposed) return wasSpeaking
      if (sessionActive && token === sessionToken) {
        // Leave RESPONDING first: startRecognition refuses to mic while the
        // state still claims we are speaking.
        setState(VState.LISTENING)
        startRecognition('ar')
      } else {
        setState(VState.IDLE)
      }
      return wasSpeaking
    },

    speak(text) {
      if (!speechSynthesisAvailable() || disposed) return false
      const spoken = prepareTextForSpeech(text)
      if (!spoken) return false
      stopSynthesis()
      const token = sessionToken
      const langTag = isArabic(text) ? 'ar-EG' : 'en-US'
      const utterance = new SpeechSynthesisUtterance(spoken)
      utterance.lang = langTag
      utterance.rate = TTS_RATE
      utterance.pitch = TTS_PITCH
      utterance.volume = TTS_VOLUME
      const voice = pickVoice(langTag)
      if (voice) {
        try {
          utterance.voice = voice
        } catch {
          /* ignore: keep browser default */
        }
      }
      currentUtterance = utterance
      busyWithSpeech = true
      setState(VState.RESPONDING)
      // Shared TTS completion: leave RESPONDING before resuming the mic,
      // otherwise startRecognition (correctly) refuses a speaking state.
      const finishSpeech = () => {
        if (token !== sessionToken || disposed) return
        busyWithSpeech = false
        currentUtterance = null
        // Continuous session: mic resumes only after TTS fully ends,
        // so the assistant never hears its own voice (no feedback loop).
        if (sessionActive) {
          setState(VState.LISTENING)
          startRecognition(isArabic(text) ? 'ar' : 'en')
        } else {
          setState(VState.IDLE)
        }
      }
      utterance.onend = finishSpeech
      utterance.onerror = finishSpeech
      try {
        window.speechSynthesis.speak(utterance)
      } catch {
        busyWithSpeech = false
        currentUtterance = null
        setState(sessionActive ? VState.LISTENING : VState.IDLE)
        return false
      }
      return true
    },

    stop() {
      this.stopListening()
      stopSynthesis()
      sessionActive = false
      sessionToken += 1
      setState(VState.IDLE)
    },

    /** Ends a continuous session explicitly (mic button toggle-off). */
    endSession() {
      endSession()
    },

    dispose() {
      disposed = true
      sessionActive = false
      sessionToken += 1
      clearSilenceTimer()
      stopSynthesis()
      try {
        if (recognition) recognition.stop()
      } catch {
        /* ignore */
      }
      // clear all listeners to prevent leaks/duplicates
      if (recognition) {
        recognition.onresult = null
        recognition.onend = null
        recognition.onerror = null
      }
      recognition = null
      setState(VState.IDLE)
    },

    get state() {
      return state.current
    },
    get speaking() {
      return busyWithSpeech
    },
    get listening() {
      return recognizing && state.current === VState.LISTENING
    },
    get session() {
      return sessionActive
    },
    get available() {
      return speechRecognitionAvailable() || speechSynthesisAvailable()
    },
  }
}

export { preprocessQuery }

export default createVoiceService
