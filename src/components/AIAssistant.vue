<template>
  <div class="ai-assistant" @keydown.escape="handleEscape">
    <Transition name="chat">
      <div v-if="isOpen" class="chat-window" role="dialog" aria-label="Chat with Shymaa's AI assistant">
        <div class="chat-header">
          <div class="chat-avatar" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"/>
            </svg>
          </div>
          <div class="chat-header-text">
            <span class="chat-title">Ask about Shymaa</span>
            <span class="chat-status">{{ statusLabel }}</span>
          </div>
          <button class="chat-close" @click="closeChat" aria-label="Close chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="chat-messages" ref="messagesContainer" aria-live="polite" aria-label="Chat messages">
          <div
            v-for="(msg, i) in messages"
            :key="i"
            :class="['chat-msg', msg.role]"
          >
            <div class="msg-bubble" v-html="formatMessage(msg.text)"></div>
          </div>
          <div v-if="isTyping" class="chat-msg assistant">
            <div class="msg-bubble typing">
              <span></span><span></span><span></span>
            </div>
          </div>
          <div v-if="liveTranscript" class="chat-msg user live-transcript">
            <div class="msg-bubble interim">{{ liveTranscript }}</div>
          </div>
          <div v-if="currentSuggestions.length && voiceState === 'idle'" class="suggested-questions">
            <button
              v-for="(q, i) in currentSuggestions"
              :key="i"
              class="suggested-btn"
              @click="sendSuggestedQuestion(q)"
            >
              {{ q }}
            </button>
          </div>
        </div>

        <div v-if="voiceState !== 'idle'" class="voice-panel" role="region" aria-label="Voice chat controls">
          <div class="voice-status" :class="'status-' + voiceState">
            <span class="voice-status-dot"></span>
            <span class="voice-status-text">{{ voiceStatusLabel }}</span>
          </div>
          <div class="voice-controls">
            <button
              v-if="voiceState === 'speaking'"
              class="voice-btn voice-stop-speak"
              @click="interruptSpeech"
              aria-label="Stop speaking"
              title="Stop speaking"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2"/>
              </svg>
            </button>
            <button
              class="voice-btn voice-mic"
              :class="{ listening: voiceState === 'listening', processing: voiceState === 'processing', speaking: voiceState === 'speaking' }"
              @click="handleMicClick"
              :disabled="voiceState === 'processing'"
              :aria-label="micAriaLabel"
            >
              <svg v-if="voiceState !== 'listening'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z"/>
                <path d="M19 10v2a7 7 0 01-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="22"/>
              </svg>
              <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2"/>
              </svg>
            </button>
            <button
              v-if="voiceState !== 'paused'"
              class="voice-btn voice-pause"
              @click="pauseVoiceChat"
              aria-label="Pause conversation"
              title="Pause"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1"/>
                <rect x="14" y="4" width="4" height="16" rx="1"/>
              </svg>
            </button>
            <button
              v-if="voiceState === 'paused'"
              class="voice-btn voice-resume"
              @click="resumeVoiceChat"
              aria-label="Resume conversation"
              title="Resume"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            </button>
            <button
              class="voice-btn voice-end"
              @click="endVoiceChat"
              aria-label="End voice chat"
              title="End voice chat"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="1" y1="1" x2="23" y2="23"/>
                <path d="M16.72 11.06A10.94 10.94 0 0119 12.55"/>
                <path d="M5 12.55a10.94 10.94 0 015.17-2.39"/>
                <path d="M10.71 5.05A16 16 0 0122.56 9"/>
                <path d="M1.42 9a15.91 15.91 0 014.7-2.88"/>
                <path d="M8.53 16.11a6 6 0 016.95 0"/>
                <line x1="12" y1="20" x2="12.01" y2="20"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="chat-input-area">
          <label for="chat-input" class="sr-only">Type your question</label>
          <input
            id="chat-input"
            ref="chatInput"
            v-model="userInput"
            @keyup.enter="sendMessage"
            placeholder="Type your question..."
            class="chat-input"
            :disabled="isTyping"
            autocomplete="off"
          />
          <button
            v-if="voiceState === 'idle'"
            class="chat-voice"
            @click="startVoiceChat"
            :disabled="!voiceApiSupported"
            aria-label="Start voice chat"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z"/>
              <path d="M19 10v2a7 7 0 01-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="22"/>
            </svg>
          </button>
          <button class="chat-send" @click="sendMessage" :disabled="!userInput.trim() || isTyping" aria-label="Send message">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
          </button>
        </div>
      </div>
    </Transition>

    <button class="chat-toggle" @click="toggleChat" :aria-label="isOpen ? 'Close chat' : 'Open chat'">
      <Transition name="icon" mode="out-in">
        <svg v-if="!isOpen" key="chat" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
        </svg>
        <svg v-else key="close" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </Transition>
    </button>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, onBeforeUnmount } from 'vue'
import { searchKnowledgeBase } from '../utils/similarity'
import { trackQuery } from '../utils/analytics'
import { detectIntent, executeNavigation, detectLanguage } from '../utils/intent-detector'
import knowledgeBase from '../data/knowledge-base.json'

const BYNARA_API_KEY = import.meta.env.VITE_BYNARA_API_KEY || ''

function buildSystemPrompt(kb) {
  if (!kb.intents) return ''
  const sections = kb.intents.map((intent) => {
    const enAnswer = intent.answer.en || ''
    const arAnswer = intent.answer.ar || ''
    const arKeywords = (intent.keywords.ar || []).slice(0, 5).join(', ')
    const enKeywords = (intent.keywords.en || []).slice(0, 5).join(', ')
    return `[${intent.id.toUpperCase()}]\nEN: ${enAnswer}\nAR: ${arAnswer}\nKeywords: ${enKeywords} | ${arKeywords}`
  })
  return `You are Shymaa Raouf Ali's portfolio AI assistant. Your ONLY purpose is answering questions about Shymaa.

## RULES (STRICT)
1. Answer ONLY from the knowledge base below — NEVER invent facts
2. Reply in the SAME language the visitor uses (Arabic ↔ English)
3. Be warm, concise, professional — 1 to 3 sentences max
4. If unsure or the question is outside scope, reply: "I don't have details on that — you can reach Shymaa directly at raoufshimaa587@gmail.com"
5. Never discuss politics, religion, other people, or anything unrelated to Shymaa's professional profile
6. For greetings, respond warmly in the visitor's language, then invite them to ask about Shymaa
7. For contact requests, always include the email: raoufshimaa587@gmail.com

## SHYMAA'S PROFILE
- Full name: Shymaa Raouf Ali
- Title: Social Media Specialist & Content Creator
- Location: Ismailia, Egypt (focus: Saudi market)
- Languages: Arabic (Native), English (Fluent), French (Fluent)
- Email: raoufshimaa587@gmail.com | Phone: +01282354052

## KNOWLEDGE BASE
${sections.join('\n\n')}`
}

const SYSTEM_PROMPT = buildSystemPrompt(knowledgeBase)

const isOpen = ref(false)
const userInput = ref('')
const isTyping = ref(false)
const messagesContainer = ref(null)
const chatInput = ref(null)
const conversationHistory = ref([])
const MAX_HISTORY = 6
const queryCache = new Map()
const CACHE_MAX = 50

const voiceState = ref('idle')
const liveTranscript = ref('')
const interimTranscript = ref('')
let autoListenEnabled = false
let recognition = null
let silenceTimer = null
let noSpeechCount = 0
const MAX_NO_SPEECH = 3
let recognitionRestartCount = 0
const MAX_RESTARTS = 5

const speechSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window
const voiceApiSupported = speechSupported && ttsSupported

let lastProcessedTranscript = ''
let lastProcessedAt = 0
let utteranceId = 0
const DEDUP_WINDOW_MS = 1500

const localResponses = {
  thanks: {
    phrases: ['thank you', 'thanks', 'thx', 'thank u', 'shukran', 'شكرا', 'شكراً', 'thanks a lot', 'thank you so much', 'يعطيك العافية', 'جزاك الله خيرا'],
    en: "You're welcome! Feel free to ask me anything about Shymaa's work or skills.",
    ar: 'على قلبي! اسأل عن أي حاجة تخص شيماء — مهاراتها، خبراتها، أو مشاريعها.'
  },
  greeting: {
    phrases: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'مرحبا', 'مرحباً', 'أهلا', 'أهلاً', 'السلام عليكم', 'هاي', 'هلا'],
    en: "Hello! I'm Shymaa's AI assistant. What would you like to know about her?",
    ar: '!مرحباً أنا مساعد شيماء الذكي. اسأل عن أي شيء يخص مهاراتها وخبراتها وعملها'
  },
  goodbye: {
    phrases: ['bye', 'goodbye', 'see you', 'good night', 'مع السلامة', 'يلا باي', 'باي', 'الى اللقاء'],
    en: "Goodbye! It was great chatting with you. Feel free to come back anytime!",
    ar: '!مع السلامة! يسعدني التحدث معك. ارجع في أي وقت'
  },
  followup: {
    phrases: [
      'info', 'tell me more', 'what else', 'anything else', 'more', 'continue', 'go on',
      'give me more information', 'what else can you tell me', 'can you tell me more',
      'ممكن تفاصيل أكتر', 'قول لي معلومات أكتر', 'في إيه تاني', 'إيه كمان', 'كمل', 'احكيلي أكتر',
      'more info', 'details', 'tell me everything', 'know more', 'else'
    ],
    en: "I can tell you about Shymaa's projects, skills, experience, education, certifications, or how to contact her. What interests you?",
    ar: 'أقدر أحكيلك عن المشاريع، المهارات، الخبرات، التعليم، الشهادات، أو طرق التواصل. إيه اللي يهمك؟'
  }
}

let naraDisabledUntil = 0
const NARA_DISABLE_DURATION = 60000

function isNaraAvailable() {
  if (naraDisabledUntil === 0) return true
  if (Date.now() >= naraDisabledUntil) {
    naraDisabledUntil = 0
    return true
  }
  return false
}

function disableNaraForSession() {
  naraDisabledUntil = Date.now() + NARA_DISABLE_DURATION
  logNara('NaraRouter disabled for 60s due to error')
}

function detectLocalResponse(text) {
  const lower = text.toLowerCase().trim()
  for (const [, config] of Object.entries(localResponses)) {
    if (config.phrases.some(p => lower === p || lower.includes(p))) {
      return detectLanguage(text) === 'ar' ? config.ar : config.en
    }
  }
  return null
}

if (speechSupported) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  recognition = new SpeechRecognition()
  recognition.continuous = true
  recognition.interimResults = true
  recognition.maxAlternatives = 1
  recognition.onresult = handleRecognitionResult
  recognition.onerror = handleRecognitionError
  recognition.onend = handleRecognitionEnd
}

const messages = ref([
  {
    role: 'assistant',
    text: navigator.language.startsWith('ar')
      ? '!مرحباً أنا مساعد شيماء الذكي. اسأل عن أي شيء يخص مهاراتها وخبراتها وعملها'
      : "Hi! I'm Shymaa's AI assistant. Ask me anything about her skills, experience, or work!",
  },
])

const statusLabel = ref('AI Assistant')
const voiceStatusLabel = ref('')
const micAriaLabel = ref('Start voice chat')

const currentSuggestions = ref([
  'What are her strongest skills?',
  'Show me her work'
])

const contextualSuggestions = {
  identity: [
    ['What are her strongest skills?', 'Show me her work'],
    ['What industries has she worked in?', 'How does she approach projects?'],
    ['What type of content does she create?', 'How can I contact her?']
  ],
  experience: [
    ['What are her strongest skills?', 'Show me her work'],
    ['What industries has she worked in?', 'What certifications does she have?'],
    ['How does she approach projects?', 'What makes her different?']
  ],
  education: [
    ['What are her strongest skills?', 'What certifications does she have?'],
    ['Show me her work', 'How does she approach projects?'],
    ['What industries has she worked in?', 'What makes her different?']
  ],
  skills: [
    ['Show me her work', 'What type of content does she create?'],
    ['What industries has she worked in?', 'How does she approach projects?'],
    ['What makes her different?', 'What certifications does she have?']
  ],
  content_types: [
    ['What industries has she worked in?', 'Show me her work'],
    ['What are her strongest skills?', 'How does she approach projects?'],
    ['What makes her different?', 'Show me case studies']
  ],
  industries: [
    ['Show me her work', 'Show me case studies'],
    ['How does she approach projects?', 'What are her strongest skills?'],
    ['What type of content does she create?', 'What makes her different?']
  ],
  projects: [
    ['Show me case studies', 'How does she approach projects?'],
    ['What industries has she worked in?', 'What are her strongest skills?'],
    ['What makes her different?', 'How can I contact her?']
  ],
  case_studies: [
    ['How does she approach projects?', 'Show me her work'],
    ['What industries has she worked in?', 'What are her strongest skills?'],
    ['What makes her different?', 'How can I contact her?']
  ],
  certifications: [
    ['What are her strongest skills?', 'Show me her work'],
    ['How does she approach projects?', 'What industries has she worked in?'],
    ['What makes her different?', 'How can I contact her?']
  ],
  approach: [
    ['What makes her different?', 'Show me her work'],
    ['What are her strongest skills?', 'Show me case studies'],
    ['What industries has she worked in?', 'How can I contact her?']
  ],
  differentiator: [
    ['Show me her work', 'How can I contact her?'],
    ['What are her strongest skills?', 'What industries has she worked in?'],
    ['Show me case studies', 'How does she approach projects?']
  ],
  contact: [
    ['Show me her work', 'What are her strongest skills?'],
    ['What industries has she worked in?', 'How does she approach projects?'],
    ['What makes her different?', 'Show me case studies']
  ],
  availability: [
    ['How can I contact her?', 'Show me her work'],
    ['What are her strongest skills?', 'What industries has she worked in?'],
    ['How does she approach projects?', 'What makes her different?']
  ],
  default: [
    ['Who is Shymaa?', 'What are her strongest skills?'],
    ['Show me her work', 'What industries has she worked in?'],
    ['How does she approach projects?', 'How can I contact her?']
  ]
}

let suggestionIndex = {}

function updateSuggestions(lastIntent) {
  const pool = contextualSuggestions[lastIntent] || contextualSuggestions.default
  if (!suggestionIndex[lastIntent]) suggestionIndex[lastIntent] = 0
  currentSuggestions.value = pool[suggestionIndex[lastIntent] % pool.length]
  suggestionIndex[lastIntent]++
}

function sendSuggestedQuestion(question) {
  userInput.value = question
  sendMessage()
}

function updateStatus() {
  switch (voiceState.value) {
    case 'idle':
      statusLabel.value = 'AI Assistant'
      voiceStatusLabel.value = ''
      micAriaLabel.value = 'Start voice chat'
      break
    case 'listening':
      statusLabel.value = 'Listening...'
      voiceStatusLabel.value = 'Listening... Speak now'
      micAriaLabel.value = 'Stop listening'
      break
    case 'processing':
      statusLabel.value = 'Processing...'
      voiceStatusLabel.value = 'Processing your request...'
      micAriaLabel.value = 'Processing'
      break
    case 'speaking':
      statusLabel.value = 'Speaking...'
      voiceStatusLabel.value = 'Speaking... Tap mic to interrupt'
      micAriaLabel.value = 'Interrupt speech'
      break
    case 'paused':
      statusLabel.value = 'Paused'
      voiceStatusLabel.value = 'Conversation paused. Tap resume to continue.'
      micAriaLabel.value = 'Resume'
      break
    case 'error':
      statusLabel.value = 'Error'
      voiceStatusLabel.value = 'Something went wrong. Tap mic to retry.'
      micAriaLabel.value = 'Retry'
      break
  }
}

function formatMessage(text) {
  return text
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
}

function getVoiceLang() {
  return navigator.language.startsWith('ar') ? 'ar-EG' : 'en-US'
}

function clearSilenceTimer() {
  if (silenceTimer) {
    clearTimeout(silenceTimer)
    silenceTimer = null
  }
}

function startSilenceTimer() {
  clearSilenceTimer()
  silenceTimer = setTimeout(() => {
    if (voiceState.value === 'listening' && interimTranscript.value.trim().length >= 2) {
      finalizeTranscript(interimTranscript.value)
    }
  }, 2500)
}

async function handleEscape() {
  if (voiceState.value !== 'idle') {
    endVoiceChat()
  } else if (isOpen.value) {
    isOpen.value = false
  }
}

async function toggleChat() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    await nextTick()
    chatInput.value?.focus()
    scrollToBottom()
  } else {
    endVoiceChat()
  }
}

function closeChat() {
  endVoiceChat()
  isOpen.value = false
}

function startVoiceChat() {
  if (!voiceApiSupported) return
  voiceState.value = 'idle'
  autoListenEnabled = true
  noSpeechCount = 0
  recognitionRestartCount = 0
  updateStatus()
  startListening()
}

function endVoiceChat() {
  autoListenEnabled = false
  clearSilenceTimer()
  stopListening()
  stopSpeaking()
  voiceState.value = 'idle'
  liveTranscript.value = ''
  interimTranscript.value = ''
  lastProcessedTranscript = ''
  lastProcessedAt = 0
  updateStatus()
}

function pauseVoiceChat() {
  autoListenEnabled = false
  stopListening()
  stopSpeaking()
  voiceState.value = 'paused'
  updateStatus()
}

function resumeVoiceChat() {
  autoListenEnabled = true
  noSpeechCount = 0
  recognitionRestartCount = 0
  startListening()
}

function startListening() {
  if (!recognition) return
  if (voiceState.value === 'processing' || voiceState.value === 'paused') return
  try {
    recognition.lang = getVoiceLang()
    recognition.start()
    voiceState.value = 'listening'
    liveTranscript.value = ''
    interimTranscript.value = ''
    updateStatus()
    noSpeechCount = 0
  } catch (e) {
    console.warn('Speech recognition start failed:', e)
    voiceState.value = 'error'
    updateStatus()
  }
}

function stopListening() {
  if (!recognition) return
  try {
    recognition.abort()
  } catch {}
}

function handleMicClick() {
  if (voiceState.value === 'listening') {
    stopListening()
    voiceState.value = 'idle'
    updateStatus()
  } else if (voiceState.value === 'speaking') {
    interruptSpeech()
  } else if (voiceState.value === 'paused') {
    resumeVoiceChat()
  } else if (voiceState.value === 'error') {
    voiceState.value = 'idle'
    startVoiceChat()
  } else {
    startVoiceChat()
  }
}

function handleRecognitionResult(event) {
  if (voiceState.value === 'speaking') return

  let interimText = ''
  let finalText = ''

  for (let i = event.resultIndex; i < event.results.length; i++) {
    const result = event.results[i]
    const transcript = result[0].transcript
    if (result.isFinal) {
      finalText += transcript
    } else {
      interimText += transcript
    }
  }

  if (interimText) {
    interimTranscript.value = interimText
    liveTranscript.value = interimText
    startSilenceTimer()
  }

  if (finalText) {
    clearSilenceTimer()
    finalizeTranscript(finalText)
  }
}

function finalizeTranscript(text) {
  const cleaned = text.trim()
  interimTranscript.value = ''
  liveTranscript.value = ''

  if (!cleaned || cleaned.length < 2) {
    noSpeechCount++
    if (noSpeechCount >= MAX_NO_SPEECH && autoListenEnabled) {
      voiceState.value = 'idle'
      updateStatus()
      addMessage('assistant', detectLanguage(cleaned) === 'ar'
        ? 'مش سامعك كويس. حاول تتكلم تاني أو اكتب سؤالك.'
        : "I can't hear you clearly. Try speaking again or type your question.")
      return
    }
    if (autoListenEnabled) {
      setTimeout(() => startListening(), 500)
    }
    return
  }

  const now = Date.now()
  if (
    cleaned === lastProcessedTranscript &&
    now - lastProcessedAt < DEDUP_WINDOW_MS
  ) {
    if (autoListenEnabled) {
      setTimeout(() => startListening(), 500)
    }
    return
  }
  lastProcessedTranscript = cleaned
  lastProcessedAt = now
  utteranceId++

  const lastMsg = messages.value[messages.value.length - 1]
  if (lastMsg && lastMsg.role === 'user' && lastMsg.text === cleaned) {
    if (autoListenEnabled) {
      setTimeout(() => startListening(), 500)
    }
    return
  }

  noSpeechCount = 0
  processUserInput(cleaned)
}

function handleRecognitionError(event) {
  console.warn('Speech recognition error:', event.error)
  clearSilenceTimer()

  if (event.error === 'not-allowed') {
    voiceState.value = 'error'
    updateStatus()
    addMessage('assistant', 'Microphone access was denied. Please allow microphone access and try again, or use text chat.')
    autoListenEnabled = false
    return
  }

  if (event.error === 'no-speech') {
    noSpeechCount++
    if (noSpeechCount >= MAX_NO_SPEECH) {
      voiceState.value = 'idle'
      updateStatus()
      addMessage('assistant', detectLanguage('') === 'ar'
        ? 'مش سامعك. حاول تتكلم تاني أو اكتب سؤالك.'
        : "I didn't hear anything. Try speaking again or type your question.")
      autoListenEnabled = false
      return
    }
    if (autoListenEnabled && voiceState.value !== 'paused') {
      setTimeout(() => startListening(), 800)
    }
    return
  }

  if (event.error === 'aborted') {
    return
  }

  if (event.error === 'network') {
    recognitionRestartCount++
    if (recognitionRestartCount >= MAX_RESTARTS) {
      voiceState.value = 'error'
      updateStatus()
      addMessage('assistant', 'Network error. Please check your connection and try again.')
      autoListenEnabled = false
      return
    }
    if (autoListenEnabled) {
      setTimeout(() => startListening(), 2000)
    }
    return
  }

  if (autoListenEnabled && voiceState.value !== 'paused') {
    setTimeout(() => startListening(), 1000)
  }
}

function handleRecognitionEnd() {
  if (
    autoListenEnabled &&
    voiceState.value === 'listening' &&
    !isProcessing()
  ) {
    setTimeout(() => startListening(), 300)
  }
}

function isProcessing() {
  return voiceState.value === 'processing' || isTyping.value
}

async function processUserInput(text) {
  if (!text || isProcessing()) return

  addMessage('user', text)
  voiceState.value = 'processing'
  updateStatus()
  userInput.value = ''

  await nextTick()
  scrollToBottom()

  let lastTopic = 'default'

  const localResponse = detectLocalResponse(text)
  if (localResponse) {
    addMessage('assistant', localResponse)
    await nextTick()
    scrollToBottom()
    if (autoListenEnabled) {
      await speakTextAuto(localResponse)
    } else {
      speakText(localResponse)
    }
    updateSuggestions(lastTopic)
    return
  }

  const intent = detectIntent(text)
  if (intent.type !== 'unknown' && intent.type !== 'empty') {
    if (intent.type === 'navigate' && intent.sectionId) {
      executeNavigation(intent.sectionId)
    }
    const response = intent.response || 'Done.'
    addMessage('assistant', response)
    await nextTick()
    scrollToBottom()
    if (autoListenEnabled) {
      await speakTextAuto(response)
    } else {
      speakText(response)
    }
    updateSuggestions(lastTopic)
    return
  }

  const kbResult = searchKnowledgeBase(text, knowledgeBase)
  if (kbResult.found) {
    lastTopic = kbResult.source || 'default'
    setCachedResponse(text, kbResult.answer)
    trackQuery(kbResult.source, kbResult.score, detectLanguage(text))
    addMessage('assistant', kbResult.answer)
    await nextTick()
    scrollToBottom()
    if (autoListenEnabled) {
      await speakTextAuto(kbResult.answer)
    } else {
      speakText(kbResult.answer)
    }
    updateSuggestions(lastTopic)
    return
  }

  const naraAnswer = await callNaraAPI(text, buildKnowledgeContext(text))
  if (naraAnswer) {
    setCachedResponse(text, naraAnswer)
    trackQuery('nara', 0, detectLanguage(text))
    addMessage('assistant', naraAnswer)
    await nextTick()
    scrollToBottom()
    if (autoListenEnabled) {
      await speakTextAuto(naraAnswer)
    } else {
      speakText(naraAnswer)
    }
    updateSuggestions(lastTopic)
    return
  }

  const fallbackMsg = detectLanguage(text) === 'ar'
    ? 'مش لاقي إجابة مباشرة في المعلومات المتاحة حاليًا. ممكن تسألني عن المشاريع أو المهارات أو الخبرات أو التعليم.'
    : "I don't have a direct answer for that. Try asking about Shymaa's projects, skills, experience, or education."
  addMessage('assistant', fallbackMsg)
  await nextTick()
  scrollToBottom()
  if (autoListenEnabled) {
    await speakTextAuto(fallbackMsg)
  } else {
    speakText(fallbackMsg)
  }
  updateSuggestions(lastTopic)
}

function addMessage(role, text) {
  messages.value.push({ role, text })
  conversationHistory.value.push({ role, text })
  if (conversationHistory.value.length > MAX_HISTORY) {
    conversationHistory.value.shift()
  }
}

function interruptSpeech() {
  if (ttsSupported) window.speechSynthesis.cancel()
  if (voiceState.value === 'speaking') {
    voiceState.value = 'listening'
    updateStatus()
    liveTranscript.value = ''
    interimTranscript.value = ''
    if (autoListenEnabled) {
      setTimeout(() => startListening(), 200)
    }
  }
}

function speakText(text) {
  if (!ttsSupported) return
  window.speechSynthesis.cancel()
  const cleanText = text.replace(/<[^>]*>/g, '').replace(/\*\*/g, '').replace(/[#*_`~]/g, '')
  if (!cleanText.trim()) return
  const utterance = new SpeechSynthesisUtterance(cleanText)
  utterance.lang = /[\u0600-\u06FF]/.test(text) ? 'ar-EG' : 'en-US'
  utterance.rate = 1
  utterance.pitch = 1
  window.speechSynthesis.speak(utterance)
}

function speakTextAuto(text) {
  return new Promise((resolve) => {
    if (!ttsSupported || !autoListenEnabled) {
      resolve()
      return
    }
    window.speechSynthesis.cancel()
    stopListening()
    const cleanText = text.replace(/<[^>]*>/g, '').replace(/\*\*/g, '').replace(/[#*_`~]/g, '')
    if (!cleanText.trim()) {
      resolve()
      return
    }
    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = /[\u0600-\u06FF]/.test(text) ? 'ar-EG' : 'en-US'
    utterance.rate = 1
    utterance.pitch = 1

    voiceState.value = 'speaking'
    updateStatus()

    utterance.onend = () => {
      if (voiceState.value === 'speaking') {
        voiceState.value = 'idle'
        updateStatus()
      }
      if (autoListenEnabled && voiceState.value !== 'paused') {
        setTimeout(() => startListening(), 500)
      }
      resolve()
    }
    utterance.onerror = () => {
      if (voiceState.value === 'speaking') {
        voiceState.value = 'idle'
        updateStatus()
      }
      if (autoListenEnabled && voiceState.value !== 'paused') {
        setTimeout(() => startListening(), 500)
      }
      resolve()
    }
    window.speechSynthesis.speak(utterance)
  })
}

function stopSpeaking() {
  if (ttsSupported) window.speechSynthesis.cancel()
}

function getCachedResponse(query) {
  const key = query.toLowerCase().trim()
  return queryCache.get(key) || null
}

function setCachedResponse(query, answer) {
  const key = query.toLowerCase().trim()
  if (queryCache.size >= CACHE_MAX) {
    const firstKey = queryCache.keys().next().value
    queryCache.delete(firstKey)
  }
  queryCache.set(key, answer)
}

function isNaraConfigured() {
  return !!(BYNARA_API_KEY && BYNARA_API_KEY.length > 0)
}

function buildKnowledgeContext(userText) {
  if (!knowledgeBase.intents) return ''
  const lang = detectLanguage(userText)
  const parts = []
  for (const intent of knowledgeBase.intents) {
    const answer = intent.answer[lang] || intent.answer.en || ''
    if (answer) {
      parts.push(`[${intent.id}]: ${answer}`)
    }
  }
  return parts.join('\n')
}

function logNara(event, detail) {
  if (import.meta.env.DEV) {
    console.log(`[Nara] ${event}`, detail || '')
  }
}

async function callNaraAPI(userQuestion, knowledgeContext = '') {
  logNara('Fallback triggered for:', userQuestion)

  if (!isNaraConfigured()) {
    logNara('Nara NOT configured — missing API key')
    return null
  }

  if (!isNaraAvailable()) {
    logNara('Nara temporarily disabled — skipping')
    return null
  }

  try {
    const kbSection = knowledgeContext
      ? `\n\nPortfolio knowledge:\n${knowledgeContext}`
      : ''
    const messages = [
      {
        role: 'system',
        content: `You are Shymaa's portfolio assistant.

Answer only using the portfolio knowledge provided below.
Do not invent skills, projects, experience, education, contact details, or achievements.
If the answer cannot be determined from the provided knowledge, say that the information is not available.

${SYSTEM_PROMPT}${kbSection}`
      },
      { role: 'user', content: userQuestion }
    ]

    logNara('Sending request')

    const response = await fetch('/api/nara/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BYNARA_API_KEY}`
      },
      body: JSON.stringify({
        model: 'longcat-2.0-free',
        messages,
        temperature: 0.7,
        max_tokens: 512
      })
    })

    if (!response.ok) {
      const status = response.status
      const errorData = await response.json().catch(() => ({}))
      const errorMsg = errorData?.error?.message || status
      logNara(`API error ${status}:`, errorMsg)

      if (status === 402 || status === 403 || status === 429) {
        disableNaraForSession()
      }

      return null
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content
    if (text) {
      logNara('Response received successfully')
      return text.trim()
    }

    logNara('Empty response from Nara')
    return null
  } catch (error) {
    logNara('Request failed:', error.message)
    return null
  }
}

async function sendMessage() {
  const text = userInput.value.trim()
  if (!text || isTyping.value) return

  if (voiceState.value !== 'idle') {
    processUserInput(text)
    return
  }

  addMessage('user', text)
  userInput.value = ''
  isTyping.value = true

  await nextTick()
  scrollToBottom()

  let lastTopic = 'default'

  const localResponse = detectLocalResponse(text)
  if (localResponse) {
    addMessage('assistant', localResponse)
    speakText(localResponse)
  } else {
    const intent = detectIntent(text)
    if (intent.type !== 'unknown' && intent.type !== 'empty') {
      if (intent.type === 'navigate' && intent.sectionId) {
        executeNavigation(intent.sectionId)
      }
      addMessage('assistant', intent.response || 'Done.')
      speakText(intent.response || 'Done.')
    } else {
      const cached = getCachedResponse(text)
      if (cached) {
        addMessage('assistant', cached)
        speakText(cached)
      } else {
        const localResult = searchKnowledgeBase(text, knowledgeBase)
        if (localResult.found) {
          lastTopic = localResult.source || 'default'
          setCachedResponse(text, localResult.answer)
          trackQuery(localResult.source, localResult.score, detectLanguage(text))
          addMessage('assistant', localResult.answer)
          speakText(localResult.answer)
        } else {
          const naraAnswer = await callNaraAPI(text, buildKnowledgeContext(text))
          if (naraAnswer) {
            setCachedResponse(text, naraAnswer)
            trackQuery('nara', 0, detectLanguage(text))
            addMessage('assistant', naraAnswer)
            speakText(naraAnswer)
          } else {
            const fallbackMsg = detectLanguage(text) === 'ar'
              ? 'مش لاقي إجابة مباشرة في المعلومات المتاحة حاليًا. ممكن تسألني عن المشاريع أو المهارات أو الخبرات أو التعليم.'
              : "I don't have a direct answer for that. Try asking about Shymaa's projects, skills, experience, or education."
            addMessage('assistant', fallbackMsg)
            speakText(fallbackMsg)
          }
        }
      }
    }
  }

  updateSuggestions(lastTopic)
  isTyping.value = false
  await nextTick()
  scrollToBottom()
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

watch(isOpen, async (val) => {
  if (val) {
    await nextTick()
    scrollToBottom()
  }
})

onBeforeUnmount(() => {
  autoListenEnabled = false
  clearSilenceTimer()
  lastProcessedTranscript = ''
  lastProcessedAt = 0
  if (recognition) {
    try { recognition.abort() } catch {}
    recognition.onresult = null
    recognition.onerror = null
    recognition.onend = null
    recognition = null
  }
  if (ttsSupported) {
    window.speechSynthesis.cancel()
  }
})
</script>

<style scoped>
.ai-assistant {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 99;
}

.chat-window {
  position: absolute;
  bottom: 72px;
  right: 0;
  width: 380px;
  max-height: 580px;
  background: var(--color-bg);
  border: 1px solid var(--color-neutral);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: var(--color-white);
  border-bottom: 1px solid var(--color-neutral);
}

.chat-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-deep));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.chat-header-text {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
}

.chat-status {
  font-size: 0.7rem;
  color: var(--color-deep);
}

.chat-close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8a7e7e;
  transition: all 0.2s ease;
}

.chat-close:hover {
  background: var(--color-neutral);
  color: var(--color-text);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 340px;
  min-height: 200px;
}

.chat-msg {
  display: flex;
}

.chat-msg.user {
  justify-content: flex-end;
}

.msg-bubble {
  max-width: 85%;
  padding: 0.75rem 1rem;
  border-radius: 14px;
  font-size: 0.85rem;
  line-height: 1.6;
  word-break: break-word;
}

.chat-msg.assistant .msg-bubble {
  background: var(--color-white);
  border: 1px solid var(--color-neutral);
  color: var(--color-text);
  border-bottom-left-radius: 4px;
}

.chat-msg.user .msg-bubble {
  background: var(--color-deep);
  color: white;
  border-bottom-right-radius: 4px;
}

.msg-bubble.interim {
  background: var(--color-neutral);
  color: var(--color-text);
  border: 1px dashed var(--color-primary);
  opacity: 0.8;
  font-style: italic;
}

.msg-bubble :deep(strong) {
  font-weight: 600;
}

.msg-bubble :deep(br) {
  display: block;
  content: '';
  margin-top: 0.35rem;
}

.typing {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 0.75rem 1.25rem;
}

.typing span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-primary);
  animation: typing 1.4s infinite ease-in-out;
}

.typing span:nth-child(2) { animation-delay: 0.2s; }
.typing span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-4px); opacity: 1; }
}

.suggested-questions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  padding: 0.5rem 0.75rem 0.75rem;
}

.suggested-btn {
  padding: 0.4rem 0.75rem;
  font-size: 0.75rem;
  font-family: var(--font-en), var(--font-ar), sans-serif;
  background: var(--color-white);
  color: var(--color-deep);
  border: 1px solid var(--color-neutral);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.suggested-btn:hover {
  background: var(--color-primary);
  color: var(--color-white);
  border-color: var(--color-primary);
}

.chat-input-area {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--color-white);
  border-top: 1px solid var(--color-neutral);
}

.chat-input {
  flex: 1;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--color-neutral);
  border-radius: 10px;
  font-family: var(--font-body);
  font-size: 0.85rem;
  background: var(--color-bg);
  color: var(--color-text);
  outline: none;
  transition: border-color 0.2s ease;
}

.chat-input:focus {
  border-color: var(--color-primary);
}

.chat-input::placeholder {
  color: #b5aaaa;
}

.chat-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.chat-send {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--color-deep);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.chat-send:hover:not(:disabled) {
  background: var(--color-text);
  transform: scale(1.05);
}

.chat-send:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.chat-voice {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--color-bg);
  border: 1px solid var(--color-neutral);
  color: var(--color-deep);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.chat-voice:hover:not(:disabled) {
  background: var(--color-neutral);
  border-color: var(--color-primary);
}

.chat-voice:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.voice-panel {
  padding: 1rem 1.25rem;
  background: var(--color-white);
  border-top: 1px solid var(--color-neutral);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.voice-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--color-deep);
  font-weight: 500;
}

.voice-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-neutral);
  transition: background 0.3s ease;
}

.status-listening .voice-status-dot {
  background: #e74c3c;
  animation: pulse-dot 1s infinite ease-in-out;
}

.status-processing .voice-status-dot {
  background: #f39c12;
  animation: pulse-dot 0.6s infinite ease-in-out;
}

.status-speaking .voice-status-dot {
  background: #27ae60;
  animation: pulse-dot 1.2s infinite ease-in-out;
}

.status-paused .voice-status-dot {
  background: #95a5a6;
}

.status-error .voice-status-dot {
  background: #e74c3c;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.3); }
}

.voice-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.voice-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.voice-mic {
  width: 52px;
  height: 52px;
  background: var(--color-deep);
  color: white;
}

.voice-mic:hover:not(:disabled) {
  background: var(--color-text);
  transform: scale(1.05);
}

.voice-mic:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.voice-mic.listening {
  background: #e74c3c;
  animation: pulse-mic 1.2s infinite ease-in-out;
}

.voice-mic.processing {
  background: #f39c12;
}

.voice-mic.speaking {
  background: #27ae60;
}

@keyframes pulse-mic {
  0%, 100% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.4); }
  50% { box-shadow: 0 0 0 14px rgba(231, 76, 60, 0); }
}

.voice-stop-speak {
  width: 36px;
  height: 36px;
  background: #e74c3c;
  color: white;
}

.voice-stop-speak:hover {
  background: #c0392b;
}

.voice-pause,
.voice-resume {
  width: 36px;
  height: 36px;
  background: var(--color-neutral);
  color: var(--color-text);
}

.voice-pause:hover,
.voice-resume:hover {
  background: var(--color-primary);
  color: white;
}

.voice-end {
  width: 36px;
  height: 36px;
  background: var(--color-neutral);
  color: var(--color-text);
}

.voice-end:hover {
  background: #e74c3c;
  color: white;
}

.chat-toggle {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--color-deep), var(--color-primary));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 30px rgba(139, 111, 114, 0.35);
  transition: all 0.35s ease;
}

.chat-toggle:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 12px 40px rgba(139, 111, 114, 0.45);
}

.chat-enter-active { transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1); }
.chat-leave-active { transition: all 0.25s ease; }
.chat-enter-from { opacity: 0; transform: translateY(12px) scale(0.95); }
.chat-leave-to { opacity: 0; transform: translateY(8px) scale(0.97); }

.icon-enter-active { transition: all 0.2s ease; }
.icon-leave-active { transition: all 0.15s ease; }
.icon-enter-from { opacity: 0; transform: rotate(-90deg) scale(0.8); }
.icon-leave-to { opacity: 0; transform: rotate(90deg) scale(0.8); }

@media (prefers-reduced-motion: reduce) {
  .chat-enter-active,
  .chat-leave-active,
  .icon-enter-active,
  .icon-leave-active {
    transition-duration: 0.01ms;
  }
  .chat-toggle:hover,
  .chat-send:hover:not(:disabled),
  .voice-mic:hover:not(:disabled) {
    transform: none;
  }
  .typing span,
  .status-listening .voice-status-dot,
  .status-processing .voice-status-dot,
  .status-speaking .voice-status-dot,
  .voice-mic.listening {
    animation-duration: 0.01ms;
  }
}

.chat-toggle:focus-visible,
.chat-send:focus-visible,
.chat-close:focus-visible,
.voice-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.chat-input:focus-visible {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 0 0 3px rgba(196, 168, 176, 0.25);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 480px) {
  .ai-assistant {
    bottom: 1.25rem;
    right: 1.25rem;
  }

  .chat-window {
    width: calc(100vw - 2.5rem);
    right: 0;
    max-height: 500px;
  }

  .voice-mic {
    width: 46px;
    height: 46px;
  }
}
</style>
