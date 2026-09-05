// VoiceService: OPTIONAL voice layer for the portfolio assistant.
//
// Designed so that voice can never break the text chat:
//   - state machine: IDLE -> LISTENING -> PROCESSING -> RESPONDING -> IDLE
//   - never allows two simultaneous requests
//   - dedupes duplicate recognition transcripts
//   - stops listening while speaking
//   - stops synthesis when needed
//   - cleans up listeners on dispose
//   - never lets the assistant listen to its own synthesized voice
//
// If any browser API is missing this module becomes a safe no-op.

import { detectLanguage, preprocessQuery } from './text-utils.js'

const VState = Object.freeze({
  IDLE: 'idle',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  RESPONDING: 'responding',
})

const DEDUPE_WINDOW_MS = 1800
const SILENCE_MS = 2600

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

export function createVoiceService({ onTranscript, onStateChange }) {
  const state = { current: VState.IDLE }

  let recognition = null
  let recognizing = false
  let disposed = false
  let silenceTimer = null
  let lastFinal = null
  let lastFinalAt = 0
  let busyWithSpeech = false

  function setState(s) {
    if (state.current === s) return
    state.current = s
    if (onStateChange) onStateChange(s)
  }

  function stopSynthesis() {
    if (!speechSynthesisAvailable()) return
    window.speechSynthesis.cancel()
    busyWithSpeech = false
  }

  function handleFinal(transcript) {
    const text = (transcript || '').trim()
    if (!text) return

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

    try {
      recognition.stop()
    } catch {
      /* ignore */
    }
    recognizing = false
    stopSynthesis()
    setState(VState.PROCESSING)
    if (onTranscript) onTranscript(text)
  }

  function startRecognition(lang) {
    if (!speechRecognitionAvailable() || disposed) return
    if (state.current === VState.PROCESSING || state.current === VState.RESPONDING) return
    if (busyWithSpeech) {
      stopSynthesis()
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    // Avoid attaching duplicate listeners to an existing instance.
    if (!recognition) {
      recognition = new SR()
      recognition.lang = lang === 'ar' ? 'ar-EG' : 'en-US'
      recognition.continuous = true
      recognition.interimResults = true
      recognition.maxAlternatives = 1

      recognition.onresult = (event) => {
        let interim = ''
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i]
          if (res.isFinal) finalTranscript += res[0].transcript
          else interim += res[0].transcript
        }
        // silence-based finalization
        if (silenceTimer) clearTimeout(silenceTimer)
        if (interim) {
          silenceTimer = setTimeout(() => handleFinal(interim), SILENCE_MS)
        }
        if (finalTranscript) handleFinal(finalTranscript)
      }

      recognition.onend = () => {
        recognizing = false
        if (silenceTimer) clearTimeout(silenceTimer)
        // Only auto-restart when we're in a listening state (not processing).
        if (
          !disposed &&
          state.current === VState.LISTENING &&
          !busyWithSpeech
        ) {
          try {
            recognition.start()
            recognizing = true
          } catch {
            /* ignore */
          }
        }
      }

      recognition.onerror = () => {
        recognizing = false
        if (silenceTimer) clearTimeout(silenceTimer)
        // never surface errors to the user; just go idle
        setState(VState.IDLE)
      }
    } else {
      // update the language for the next session
      try {
        recognition.lang = lang === 'ar' ? 'ar-EG' : 'en-US'
      } catch {
        /* ignore */
      }
    }

    try {
      recognition.start()
      recognizing = true
      setState(VState.LISTENING)
    } catch {
      setState(VState.IDLE)
    }
  }

  return {
    listen() {
      if (!speechRecognitionAvailable()) {
        setState(VState.IDLE)
        return false
      }
      if (disposed) return false
      if (state.current !== VState.IDLE) return false
      startRecognition('ar') // default to Arabic; refined per transcript
      return true
    },

    stopListening() {
      recognizing = false
      if (silenceTimer) clearTimeout(silenceTimer)
      try {
        if (recognition) recognition.stop()
      } catch {
        /* ignore */
      }
      setState(VState.IDLE)
    },

    speak(text) {
      if (!speechSynthesisAvailable() || disposed) return
      stopSynthesis()
      const utterance = new SpeechSynthesisUtterance(String(text))
      utterance.lang = isArabic(text) ? 'ar-EG' : 'en-US'
      utterance.rate = 0.95
      busyWithSpeech = true
      setState(VState.RESPONDING)
      utterance.onend = () => {
        busyWithSpeech = false
        setState(VState.IDLE)
      }
      utterance.onerror = () => {
        busyWithSpeech = false
        setState(VState.IDLE)
      }
      window.speechSynthesis.speak(utterance)
    },

    stop() {
      this.stopListening()
      stopSynthesis()
      setState(VState.IDLE)
    },

    dispose() {
      disposed = true
      if (silenceTimer) clearTimeout(silenceTimer)
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
    get available() {
      return speechRecognitionAvailable() || speechSynthesisAvailable()
    },
  }
}

export { VState, preprocessQuery }

export default createVoiceService
