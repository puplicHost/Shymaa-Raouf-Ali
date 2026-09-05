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
            <span class="chat-status">
              <span class="status-dot"></span>
              {{ voiceState === 'listening' ? 'Listening…' : 'Portfolio Assistant' }}
            </span>
          </div>
          <button class="chat-close" @click="closeChat" aria-label="Close chat">
            <IconGlyph :path="ui.close" :size="18" />
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
            :class="{ active: voiceState === 'listening' }"
            @click="toggleVoice"
            :aria-label="voiceState === 'listening' ? 'Stop listening' : 'Speak your question'"
            :title="voiceState === 'listening' ? 'Stop listening' : 'Speak your question'"
          >
            <IconGlyph :path="ui.microphone" :size="18" />
          </button>
          <button class="chat-send" @click="sendMessage()" :disabled="!userInput.trim() || isTyping" aria-label="Send message">
            <IconGlyph :path="ui.send" :size="18" />
          </button>
        </div>
      </div>
    </Transition>

    <button class="chat-toggle" @click="toggleChat" :aria-label="isOpen ? 'Close chat' : 'Open chat'">
      <Transition name="icon" mode="out-in">
        <IconGlyph v-if="!isOpen" key="chat" :path="ui.chatProcessing" :size="24" />
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
import IconGlyph from './IconGlyph.vue'
import { ui } from '../data/icons.js'

const isOpen = ref(false)
const userInput = ref('')
const isTyping = ref(false)
const voiceState = ref('idle')
const voiceAvailable = ref(false)
const messagesContainer = ref(null)
const chatInput = ref(null)
let voiceService = null

// Initial suggestions shown before the first message (unchanged).
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

const messages = ref([
  {
    role: 'assistant',
    text: navigator.language.startsWith('ar')
      ? '!مرحباً أنا المساعد الذكي لموقع شيماء. اسأل عن مهاراتها ومشاريعها وطريقة شغلها'
      : "Hi! I'm Shymaa's portfolio assistant. Ask me about her skills, projects, or how she works!",
  },
])

// Escape untrusted text first, then apply safe formatting to trusted content.
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

function toggleVoice() {
  if (!voiceService) return
  if (voiceState.value === 'listening') {
    voiceService.stop()
    voiceState.value = 'idle'
  } else {
    // no listening while typing/processing
    if (isTyping.value) return
    voiceService.listen()
  }
}

async function sendMessage(text = null) {
  const input = text || userInput.value.trim()
  if (!input || isTyping.value) return

  if (voiceService) {
    voiceService.stop()
    voiceState.value = 'idle'
  }

  addMessage('user', input)
  userInput.value = ''
  isTyping.value = true
  await scrollToBottom()

  const result = await assistantEngine.process(input)

  addMessage('assistant', result.answer)
  assistantLang.value = result.lang || detectLanguage(input)

  // Contextual follow-ups: replace the buttons after every answer with the two
  // suggestions that belong to the current intent. Unknown/fallback answers
  // fall back to the standard starting suggestions so the conversation never
  // dead-ends.
  if (result.followUps && result.followUps.length === 2) {
    suggestions.value = result.followUps.map((f) => f.label)
    showSuggestionHeader.value = true
  } else {
    suggestions.value = [...DEFAULT_SUGGESTIONS]
    showSuggestionHeader.value = false
  }

  // Optionally speak the answer (voice is an optional layer).
  if (voiceService && result.source !== 'cooldown') {
    voiceService.speak(result.answer)
  }

  isTyping.value = false
  await scrollToBottom()
}

onMounted(() => {
  voiceService = createVoiceService({
    onTranscript: (text) => {
      sendMessage(text)
    },
    onStateChange: (s) => {
      voiceState.value = s
    },
  })
  voiceAvailable.value = voiceService.available

  if (voiceService) {
    // start in idle
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
  background: var(--paper-3, #fbf7f0);
  border: 1px solid var(--hairline-strong, rgba(34, 24, 22, 0.3));
  border-radius: 2px;
  box-shadow: 0 24px 64px rgba(34, 24, 22, 0.18);
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
  background: var(--paper, #f4eee4);
  border-bottom: 1px solid var(--hairline, rgba(34, 24, 22, 0.14));
}

.chat-avatar {
  width: 40px;
  height: 40px;
  border-radius: 2px;
  background: var(--ink, #221816);
  color: var(--on-ink, #f4eee4);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-mark {
  font-family: var(--font-display, serif);
  font-size: 1.15rem;
  font-weight: 600;
  line-height: 1;
}

.chat-header-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.chat-title {
  font-family: var(--font-display, serif);
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--ink, #221816);
}

.chat-status {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted, #83746a);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent, #9e3a4e);
}

.chat-close {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted, #83746a);
  border: 1px solid var(--hairline, rgba(34, 24, 22, 0.14));
  transition: all 0.2s ease;
  background: transparent;
  cursor: pointer;
}

.chat-close:hover {
  color: var(--ink, #221816);
  border-color: var(--ink, #221816);
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
  border-radius: 2px;
  font-size: 0.86rem;
  line-height: 1.65;
  word-break: break-word;
}

.chat-msg.assistant .msg-bubble {
  background: var(--paper, #f4eee4);
  border: 1px solid var(--hairline, rgba(34, 24, 22, 0.14));
  color: var(--ink, #221816);
}

.chat-msg.user .msg-bubble {
  background: var(--ink, #221816);
  color: var(--on-ink, #f4eee4);
  border: 1px solid var(--ink, #221816);
}

.msg-bubble :deep(strong) {
  font-weight: 700;
  color: var(--accent, #9e3a4e);
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
  background: var(--accent, #9e3a4e);
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
  border-bottom: 1px solid var(--hairline, rgba(34, 24, 22, 0.14));
}

.suggestions-header {
  width: 100%;
  font-size: 0.66rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted, #83746a);
  margin-bottom: 0.1rem;
}

.suggestion-btn {
  padding: 0.4rem 0.85rem;
  font-size: 0.76rem;
  font-family: var(--font-body), var(--font-ar), sans-serif;
  background: transparent;
  color: var(--ink-2, #4a3b32);
  border: 1px solid var(--hairline-strong, rgba(34, 24, 22, 0.3));
  border-radius: 100px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.suggestion-btn:hover {
  background: var(--accent, #9e3a4e);
  color: var(--on-accent, #fbf7f0);
  border-color: var(--accent, #9e3a4e);
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
  background: var(--paper, #f4eee4);
  border-top: 1px solid var(--hairline, rgba(34, 24, 22, 0.14));
}

.chat-input {
  flex: 1;
  padding: 0.72rem 0.9rem;
  border: 1px solid var(--hairline-strong, rgba(34, 24, 22, 0.3));
  border-radius: 2px;
  font-family: var(--font-body), var(--font-ar), sans-serif;
  font-size: 0.86rem;
  background: var(--paper-3, #fbf7f0);
  color: var(--ink, #221816);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.chat-input:focus {
  border-color: var(--accent, #9e3a4e);
  box-shadow: 0 0 0 3px var(--accent-soft, rgba(158, 58, 78, 0.12));
}

.chat-input::placeholder {
  color: #b3a69c;
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
  border: 1px solid var(--hairline-strong, rgba(34, 24, 22, 0.3));
  color: var(--ink-2, #4a3b32);
}

.chat-mic:hover:not(:disabled) {
  border-color: var(--accent, #9e3a4e);
  color: var(--accent, #9e3a4e);
}

.chat-mic.active {
  background: var(--accent, #9e3a4e);
  border-color: var(--accent, #9e3a4e);
  color: var(--on-accent, #fbf7f0);
}

.chat-send {
  background: var(--ink, #221816);
  color: var(--on-ink, #f4eee4);
  border: 1px solid var(--ink, #221816);
}

.chat-send:hover:not(:disabled) {
  background: var(--accent, #9e3a4e);
  border-color: var(--accent, #9e3a4e);
  transform: scale(1.05);
}

.chat-send:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* Launcher --------------------------------------------------------------- */
.chat-toggle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--ink, #221816);
  color: var(--on-ink, #f4eee4);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 1px var(--hairline-strong, rgba(34, 24, 22, 0.3)),
    0 14px 34px rgba(34, 24, 22, 0.22);
  transition: all 0.35s var(--ease, cubic-bezier(0.22, 1, 0.36, 1));
  border: none;
  cursor: pointer;
}

.chat-toggle:hover {
  background: var(--accent, #9e3a4e);
  transform: translateY(-3px) scale(1.04);
  box-shadow: 0 0 0 1px var(--accent, #9e3a4e),
    0 18px 40px rgba(158, 58, 78, 0.3);
}

.chat-toggle::before {
  content: '';
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  border: 1px solid var(--accent-soft, rgba(158, 58, 78, 0.25));
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
  }

  [dir='rtl'] .ai-assistant {
    right: auto;
    left: 1.1rem;
  }

  .chat-window {
    width: calc(100vw - 2.2rem);
    right: 0;
    max-height: 78vh;
  }

  .chat-toggle {
    width: 56px;
    height: 56px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .chat-toggle,
  .chat-send,
  .typing span {
    animation: none;
    transition: none;
  }
}
</style>