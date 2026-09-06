<template>
  <div class="ai-assistant" @keydown.escape="closeChat">
    <Transition name="chat">
      <div v-if="isOpen" class="chat-window" role="dialog" aria-label="Chat with Shymaa's portfolio assistant">
        <div class="chat-header">
          <div class="chat-avatar" aria-hidden="true">
            <span class="avatar-mark">S.</span>
          </div>
          <div class="chat-header-text">
            <span class="chat-title">Ask about Shymaa</span>
            <span class="chat-status" aria-live="polite">
              <span class="status-dot"></span>
              {{ voiceStatusText }}
            </span>
          </div>
          <button v-if="isSpeaking" class="skip-btn" @click="skipSpeech" aria-label="Skip speaking">
            {{ t('assistant.skip') || 'Skip' }}
          </button>
          <button class="chat-close" @click="closeChat" aria-label="Close chat">
            <IconGlyph :path="ui.close" :size="18" />
          </button>
        </div>

        <!-- Speaking pill -->
        <div v-if="isSpeaking" class="speaking-pill" aria-hidden="true">
          <span class="speaking-bars">
            <span></span><span></span><span></span><span></span>
          </span>
          <span class="speaking-label">{{ t('assistant.speaking') || 'Speaking…' }}</span>
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
        </div>

        <div class="chat-suggestions" v-if="suggestions.length">
          <span v-if="showSuggestionHeader" class="suggestions-header">{{ suggestionHeader }}</span>
          <button
            v-for="(q, i) in suggestions"
            :key="i"
            class="suggestion-btn"
            :disabled="isTyping"
            @click="sendMessage(q)"
          >
            {{ q }}
          </button>
        </div>

        <div class="chat-input-area">
          <label for="chat-input" class="sr-only">Type your question</label>
          <input
            id="chat-input"
            ref="chatInput"
            v-model="userInput"
            @keyup.enter="sendMessage()"
            placeholder="Type your question…"
            class="chat-input"
            :disabled="isTyping"
            autocomplete="off"
          />
          <button
            v-if="voiceAvailable"
            class="chat-mic"
            :class="{ active: voiceSessionActive }"
            @click="toggleVoice"
            :aria-pressed="voiceSessionActive"
            :aria-label="voiceMicLabel"
            :title="voiceMicLabel"
          >
            <IconGlyph :path="ui.microphone" :size="18" />
          </button>
          <button class="chat-send" @click="sendMessage()" :disabled="!userInput.trim() || isTyping" aria-label="Send message">
            <IconGlyph :path="ui.send" :size="18" />
          </button>
        </div>
      </div>
    </Transition>

    <button class="chat-toggle" :class="toggleStateClass" @click="toggleChat" :aria-label="isOpen ? 'Close chat' : 'Ask Shymaa'">
      <Transition name="icon" mode="out-in">
        <span v-if="isTyping && !isOpen" key="typing" class="chat-toggle-label typing-indicator">
          <span class="typing-dots"><span></span><span></span><span></span></span>
          <span class="chat-toggle-text">{{ t('assistant.askLabel') }}</span>
        </span>
        <span v-else-if="!isOpen" key="chat" class="chat-toggle-label">
          <IconGlyph :path="ui.chatProcessing" :size="20" />
          <span class="chat-toggle-text">{{ t('assistant.askLabel') }}</span>
        </span>
        <IconGlyph v-else key="close" :path="ui.close" :size="24" />
      </Transition>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch, onMounted, onBeforeUnmount } from 'vue'
import assistantEngine from '../services/assistant-engine.js'
import { createVoiceService } from '../services/voice-service.js'
import { detectLanguage } from '../services/text-utils.js'
import { useLocale } from '../composables/useLocale.js'
import IconGlyph from './IconGlyph.vue'
import { ui } from '../data/icons.js'

const { t } = useLocale()

const isOpen = ref(false)
const userInput = ref('')
const isTyping = ref(false)
const isSpeaking = ref(false)
const voiceState = ref('idle')
const voiceAvailable = ref(false)
const messagesContainer = ref(null)
const chatInput = ref(null)
let voiceService = null

const DEFAULT_SUGGESTIONS = [
  'Who is Shymaa?',
  'What are her skills?',
  'Show me her projects',
  'How to contact her?',
]

const suggestions = ref([...DEFAULT_SUGGESTIONS])
const showSuggestionHeader = ref(false)
const assistantLang = ref('en')

const suggestionHeader = computed(() =>
  showSuggestionHeader.value
    ? assistantLang.value === 'ar'
      ? 'ممكن كمان تعرف:'
      : 'You can also ask:'
    : ''
)

const voiceSessionActive = computed(
  () => voiceState.value === 'listening' || voiceState.value === 'responding' || voiceState.value === 'processing'
)

// Launcher icon mirrors the voice state so the assistant itself looks alive:
// pulsing ring while listening, glow while speaking. Purely visual.
const toggleStateClass = computed(() => {
  if (!isOpen.value) {
    if (voiceState.value === 'listening') return 'is-listening'
    if (voiceState.value === 'responding' || isSpeaking.value) return 'is-speaking'
    if (voiceState.value === 'processing') return 'is-thinking'
  }
  return ''
})

// Human-readable voice state (Arabic/English), never technical jargon.
const voiceStatusText = computed(() => {
  const ar = assistantLang.value === 'ar'
  if (isSpeaking.value || voiceState.value === 'responding') return t('assistant.speaking') || (ar ? 'شيماء بترد…' : 'Speaking…')
  switch (voiceState.value) {
    case 'listening':
      return ar ? 'أنا سامعك…' : 'Listening…'
    case 'processing':
      return ar ? 'بفكر…' : 'Thinking…'
    case 'stopped':
      return ar ? 'متوقف' : 'Stopped'
    case 'error':
      return ar ? 'اضغط للتحدث' : 'Tap to talk'
    default:
      return t('assistant.title') || 'Portfolio Assistant'
  }
})

const voiceMicLabel = computed(() => {
  const ar = assistantLang.value === 'ar'
  return voiceSessionActive.value
    ? ar
      ? 'إنهاء الجلسة الصوتية'
      : 'End voice session'
    : ar
      ? 'تحدث بسؤالك'
      : 'Speak your question'
})

const messages = ref([
  {
    role: 'assistant',
    text: navigator.language.startsWith('ar')
      ? '!مرحباً أنا المساعد الذكي لموقع شيماء. اسأل عن مهاراتها ومشاريعها وطريقة شغلها'
      : "Hi! I'm Shymaa's portfolio assistant. Ask me about her skills, projects, or how she works!",
  },
])

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatMessage(text) {
  const escaped = escapeHtml(text)
  return escaped
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
}

function addMessage(role, text) {
  messages.value.push({ role, text })
}

async function scrollToBottom() {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

function toggleChat() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    nextTick(() => {
      chatInput.value?.focus()
      scrollToBottom()
    })
  }
}

function closeChat() {
  isOpen.value = false
  if (voiceService) voiceService.stop()
  voiceState.value = 'idle'
}

function skipSpeech() {
  // Interrupt button: stops the spoken copy immediately but keeps a live
  // voice session going (mic resumes listening inside the session).
  if (voiceService) voiceService.interrupt()
  isSpeaking.value = false
}

function toggleVoice() {
  if (!voiceService) return
  if (voiceSessionActive.value) {
    // End the continuous session explicitly.
    voiceService.endSession()
  } else {
    if (isTyping.value) return
    voiceService.startSession()
  }
}

async function sendMessage(text = null, opts = {}) {
  const input = text || userInput.value.trim()
  if (!input || isTyping.value) return

  // Typed (or tapped) messages take over: end any voice session so the mic
  // never fights the keyboard. Voice transcripts keep the session alive.
  if (voiceService && !opts.fromVoice) {
    voiceService.stop()
    voiceState.value = 'idle'
  }

  addMessage('user', input)
  userInput.value = ''
  isTyping.value = true
  await scrollToBottom()

  const isMobile = window.innerWidth <= 768
  if (isMobile && isOpen.value) {
    isOpen.value = false
  }

  const result = await assistantEngine.process(input)

  addMessage('assistant', result.answer)
  assistantLang.value = result.lang || detectLanguage(input)

  if (result.followUps && result.followUps.length === 2) {
    suggestions.value = result.followUps.map((f) => f.label)
    showSuggestionHeader.value = true
  } else {
    suggestions.value = [...DEFAULT_SUGGESTIONS]
    showSuggestionHeader.value = false
  }

  if (voiceService && result.source !== 'cooldown') {
    isSpeaking.value = true
    // speak() sanitizes a TTS-only copy; the chat bubble keeps raw text.
    // Inside a voice session the mic auto-resumes after TTS ends.
    const started = voiceService.speak(result.answer)
    if (!started) {
      isSpeaking.value = false
    } else {
      const checkSpeaking = setInterval(() => {
        if (!voiceService || !voiceService.speaking) {
          isSpeaking.value = false
          clearInterval(checkSpeaking)
        }
      }, 200)
    }
  }

  isTyping.value = false
  await scrollToBottom()
}

onMounted(() => {
  voiceService = createVoiceService({
    onTranscript: (text) => {
      // Voice transcripts join the same chat history and engine pipeline;
      // fromVoice keeps the continuous session alive (no full stop).
      sendMessage(text, { fromVoice: true })
    },
    onStateChange: (s) => {
      voiceState.value = s
    },
  })
  voiceAvailable.value = voiceService.available

  if (voiceService) {
    voiceState.value = voiceService.state
  }
})

onBeforeUnmount(() => {
  if (voiceService) {
    voiceService.dispose()
    voiceService = null
  }
})

watch(isOpen, async (val) => {
  if (val) {
    await nextTick()
    scrollToBottom()
  }
})
</script>

<style scoped>
.ai-assistant {
  position: fixed;
  bottom: 1.75rem;
  right: 1.75rem;
  z-index: 99;
}

[dir='rtl'] .ai-assistant {
  right: auto;
  left: 1.75rem;
}

/* Window -------------------------------------------------------------- */
.chat-window {
  position: absolute;
  bottom: 74px;
  right: 0;
  width: 400px;
  max-height: 580px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

[dir='rtl'] .chat-window {
  right: auto;
  left: 0;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1rem 1.15rem;
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
}

.chat-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--accent);
  color: var(--on-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-mark {
  font-family: var(--font-display, sans-serif);
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1;
}

.chat-header-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.chat-title {
  font-family: var(--font-display, sans-serif);
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text);
}

.chat-status {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--cyan);
}

/* Skip button */
.skip-btn {
  padding: 0.3rem 0.7rem;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--cyan);
  border: 1px solid rgba(44, 232, 200, 0.3);
  border-radius: 9999px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.skip-btn:hover {
  background: rgba(44, 232, 200, 0.1);
  border-color: var(--cyan);
}

/* Speaking pill */
.speaking-pill {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.6rem 1.15rem;
  background: rgba(44, 232, 200, 0.05);
  border-bottom: 1px solid var(--border);
}

.speaking-bars {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 18px;
}

.speaking-bars span {
  width: 3px;
  height: 100%;
  background: var(--cyan);
  border-radius: 2px;
  animation: speakBar 0.8s ease-in-out infinite;
}

.speaking-bars span:nth-child(1) { animation-delay: 0s; }
.speaking-bars span:nth-child(2) { animation-delay: 0.15s; }
.speaking-bars span:nth-child(3) { animation-delay: 0.3s; }
.speaking-bars span:nth-child(4) { animation-delay: 0.45s; }

@keyframes speakBar {
  0%, 100% { transform: scaleY(0.3); }
  50% { transform: scaleY(1); }
}

.speaking-label {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--cyan);
}

.chat-close {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  border: 1px solid var(--border);
  transition: all 0.2s ease;
  background: transparent;
  cursor: pointer;
}

.chat-close:hover {
  color: var(--text);
  border-color: var(--text);
}

/* Messages ------------------------------------------------------------ */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
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
  padding: 0.7rem 0.95rem;
  border-radius: 16px;
  font-size: 0.86rem;
  line-height: 1.65;
  word-break: break-word;
}

.chat-msg.assistant .msg-bubble {
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text);
}

.chat-msg.user .msg-bubble {
  background: var(--accent);
  color: var(--on-accent);
  border: 1px solid var(--accent);
}

.msg-bubble :deep(strong) {
  font-weight: 700;
  color: var(--cyan);
}

.chat-msg.user .msg-bubble :deep(strong) {
  color: inherit;
}

.msg-bubble :deep(br) {
  display: block;
  content: '';
  margin-top: 0.35rem;
}

.typing {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  padding: 0.7rem 1rem;
}

.typing span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  animation: typing 1.4s infinite ease-in-out;
}

.typing span:nth-child(2) { animation-delay: 0.2s; }
.typing span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
  30% { transform: translateY(-4px); opacity: 1; }
}

/* Suggestions ---------------------------------------------------------- */
.chat-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  padding: 0.6rem 1.15rem 0.85rem;
  border-bottom: 1px solid var(--border);
}

.suggestions-header {
  width: 100%;
  font-size: 0.66rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 0.1rem;
}

.suggestion-btn {
  padding: 0.4rem 0.85rem;
  font-size: 0.76rem;
  font-family: var(--font-body), var(--font-ar), sans-serif;
  background: transparent;
  color: var(--text);
  border: 1px solid var(--border-strong);
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.suggestion-btn:hover {
  background: var(--accent);
  color: var(--on-accent);
  border-color: var(--accent);
}

.suggestion-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Input ---------------------------------------------------------------- */
.chat-input-area {
  display: flex;
  gap: 0.55rem;
  align-items: center;
  padding: 0.9rem 1.15rem;
  background: var(--surface-2);
  border-top: 1px solid var(--border);
}

.chat-input {
  flex: 1;
  min-width: 0;
  padding: 0.72rem 0.9rem;
  border: 1px solid var(--border-strong);
  border-radius: 12px;
  font-family: var(--font-body), var(--font-ar), sans-serif;
  font-size: 0.86rem;
  background: var(--surface);
  color: var(--text);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.chat-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.chat-input::placeholder {
  color: var(--muted);
}

.chat-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.chat-mic,
.chat-send {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.chat-mic {
  background: transparent;
  border: 1px solid var(--border-strong);
  color: var(--text);
}

.chat-mic:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}

.chat-mic.active {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--on-accent);
}

.chat-send {
  background: var(--accent);
  color: var(--on-accent);
  border: 1px solid var(--accent);
}

.chat-send:hover:not(:disabled) {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
  transform: scale(1.05);
}

.chat-send:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* Launcher --------------------------------------------------------------- */
.chat-toggle {
  height: 52px;
  border-radius: 9999px;
  background: var(--surface);
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 1px var(--border-strong),
    0 14px 34px rgba(0, 0, 0, 0.4);
  transition: all 0.35s var(--ease, cubic-bezier(0.22, 1, 0.36, 1));
  border: none;
  cursor: pointer;
  padding: 0 1.25rem;
  gap: 0.55rem;
}

.chat-toggle-label {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.chat-toggle-text {
  font-family: var(--font-body), sans-serif;
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.typing-indicator {
  gap: 0.65rem;
}

.typing-dots {
  display: inline-flex;
  gap: 3px;
  align-items: center;
}

.typing-dots span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--text);
  animation: toggleTyping 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes toggleTyping {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
  30% { transform: translateY(-3px); opacity: 1; }
}

.chat-toggle:hover {
  background: var(--accent);
  transform: translateY(-3px) scale(1.04);
  box-shadow: 0 0 0 1px var(--accent),
    0 18px 40px rgba(166, 116, 255, 0.3);
}

/* Voice state on the launcher itself: pulsing ring while listening,
   steady glow while speaking, dimmed while thinking. */
.chat-toggle.is-listening {
  border: 1px solid var(--accent);
  animation: voicePulse 1.8s ease-in-out infinite;
}

.chat-toggle.is-speaking {
  background: var(--accent);
  color: var(--on-accent);
  box-shadow: 0 0 0 2px var(--accent-soft),
    0 0 28px rgba(166, 116, 255, 0.55);
}

.chat-toggle.is-thinking {
  opacity: 0.85;
}

@keyframes voicePulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(166, 116, 255, 0.45), 0 14px 34px rgba(0, 0, 0, 0.4); }
  50% { box-shadow: 0 0 0 10px rgba(166, 116, 255, 0), 0 14px 34px rgba(0, 0, 0, 0.4); }
}

.chat-toggle::before {
  content: '';
  position: absolute;
  inset: -8px;
  border-radius: 9999px;
  border: 1px solid var(--accent-soft);
  animation: ring 3s ease-in-out infinite;
  pointer-events: none;
}

@keyframes ring {
  0% { opacity: 0.7; transform: scale(1); }
  55% { opacity: 0; transform: scale(1.18); }
  100% { opacity: 0; transform: scale(1.18); }
}

.chat-enter-active { transition: all 0.35s var(--ease, cubic-bezier(0.22, 1, 0.36, 1)); }
.chat-leave-active { transition: all 0.25s ease; }
.chat-enter-from { opacity: 0; transform: translateY(12px) scale(0.97); }
.chat-leave-to { opacity: 0; transform: translateY(8px) scale(0.98); }

.icon-enter-active { transition: all 0.2s ease; }
.icon-leave-active { transition: all 0.15s ease; }
.icon-enter-from { opacity: 0; transform: rotate(-90deg) scale(0.8); }
.icon-leave-to { opacity: 0; transform: rotate(90deg) scale(0.8); }

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
    bottom: 1.1rem;
    right: 1.1rem;
    bottom: calc(1.1rem + env(safe-area-inset-bottom, 0px));
    right: calc(1.1rem + env(safe-area-inset-right, 0px));
  }

  [dir='rtl'] .ai-assistant {
    right: auto;
    left: 1.1rem;
    left: calc(1.1rem + env(safe-area-inset-left, 0px));
  }

  .chat-window {
    width: calc(100vw - 2.2rem);
    max-width: calc(100vw - 2.2rem);
    right: 0;
    max-height: 78vh;
    max-height: 78dvh;
  }

  .chat-messages {
    min-height: 120px;
    padding: 1rem;
  }

  .chat-input-area {
    padding: 0.8rem 0.9rem;
    padding-bottom: calc(0.8rem + env(safe-area-inset-bottom, 0px));
  }

  .chat-input {
    min-width: 0;
    font-size: 1rem;
  }

  .chat-mic,
  .chat-send {
    width: 44px;
    height: 44px;
  }

  .chat-toggle {
    height: 48px;
    padding: 0 1rem;
  }

  .chat-toggle-text {
    font-size: 0.78rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .chat-toggle,
  .chat-send,
  .typing span,
  .typing-dots span,
  .speaking-bars span {
    animation: none;
    transition: none;
  }

  .chat-toggle.is-listening {
    border: 1px solid var(--accent);
  }

  .chat-toggle.is-speaking {
    background: var(--accent);
    color: var(--on-accent);
  }

  .speaking-bars span {
    transform: scaleY(0.6);
  }
}
</style>
