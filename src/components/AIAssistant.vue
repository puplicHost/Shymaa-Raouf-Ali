<template>
  <div class="ai-assistant" @keydown.escape="closeChat">
    <Transition name="chat">
      <div v-if="isOpen" class="chat-window" role="dialog" aria-label="Chat with Shymaa's portfolio assistant">
        <div class="chat-header">
          <div class="chat-avatar" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"/>
            </svg>
          </div>
          <div class="chat-header-text">
            <span class="chat-title">Ask about Shymaa</span>
            <span class="chat-status">{{ voiceState === 'listening' ? 'Listening…' : 'Portfolio Assistant' }}</span>
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
        </div>

        <div class="chat-suggestions" v-if="messages.length <= 1">
          <button
            v-for="(q, i) in suggestions"
            :key="i"
            class="suggestion-btn"
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="9" y="2" width="6" height="12" rx="3"></rect>
              <path d="M5 10a7 7 0 0 0 14 0M12 17v4M8 21h8"></path>
            </svg>
          </button>
          <button class="chat-send" @click="sendMessage()" :disabled="!userInput.trim() || isTyping" aria-label="Send message">
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
import { ref, nextTick, watch, onMounted, onBeforeUnmount } from 'vue'
import assistantEngine from '../services/assistant-engine.js'
import { createVoiceService } from '../services/voice-service.js'
import { detectLanguage } from '../services/text-utils.js'

const isOpen = ref(false)
const userInput = ref('')
const isTyping = ref(false)
const voiceState = ref('idle')
const voiceAvailable = ref(false)
const messagesContainer = ref(null)
const chatInput = ref(null)
let voiceService = null

const messages = ref([
  {
    role: 'assistant',
    text: navigator.language.startsWith('ar')
      ? '!مرحباً أنا المساعد الذكي لموقع شيماء. اسأل عن مهاراتها ومشاريعها وطريقة شغلها'
      : "Hi! I'm Shymaa's portfolio assistant. Ask me about her skills, projects, or how she works!",
  },
])

const suggestions = ref([
  'Who is Shymaa?',
  'What are her skills?',
  'Show me her projects',
  'How to contact her?',
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
  const lang = detectLanguage(input)

  // Optionally speak the answer (voice is an optional layer).
  if (voiceService && result.source !== 'cooldown') {
    voiceService.speak(result.answer)
  }

  // Add a natural conversational follow-up (never fabricates facts).
  const followUpText = assistantEngine.getFollowUp(input)
  if (followUpText) {
    messages.value.push({ role: 'assistant', text: followUpText })
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
  background: var(--color-bg, #fff);
  border: 1px solid var(--color-neutral, #e0d6d8);
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
  background: var(--color-white, #fff);
  border-bottom: 1px solid var(--color-neutral, #e0d6d8);
}

.chat-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--color-primary, #C4A8B0), var(--color-deep, #8B6F72));
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
  color: var(--color-text, #3d3236);
}

.chat-status {
  font-size: 0.7rem;
  color: var(--color-deep, #8B6F72);
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
  background: none;
  border: none;
  cursor: pointer;
}

.chat-close:hover {
  background: var(--color-neutral, #e0d6d8);
  color: var(--color-text, #3d3236);
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
  background: var(--color-white, #fff);
  border: 1px solid var(--color-neutral, #e0d6d8);
  color: var(--color-text, #3d3236);
  border-bottom-left-radius: 4px;
}

.chat-msg.user .msg-bubble {
  background: var(--color-deep, #8B6F72);
  color: white;
  border-bottom-right-radius: 4px;
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
  background: var(--color-primary, #C4A8B0);
  animation: typing 1.4s infinite ease-in-out;
}

.typing span:nth-child(2) { animation-delay: 0.2s; }
.typing span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-4px); opacity: 1; }
}

.chat-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  padding: 0.5rem 0.75rem 0.75rem;
}

.suggestion-btn {
  padding: 0.4rem 0.75rem;
  font-size: 0.75rem;
  font-family: var(--font-en), var(--font-ar), sans-serif;
  background: var(--color-white, #fff);
  color: var(--color-deep, #8B6F72);
  border: 1px solid var(--color-neutral, #e0d6d8);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.suggestion-btn:hover {
  background: var(--color-primary, #C4A8B0);
  color: var(--color-white, #fff);
  border-color: var(--color-primary, #C4A8B0);
}

.chat-input-area {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--color-white, #fff);
  border-top: 1px solid var(--color-neutral, #e0d6d8);
}

.chat-input {
  flex: 1;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--color-neutral, #e0d6d8);
  border-radius: 10px;
  font-family: var(--font-body);
  font-size: 0.85rem;
  background: var(--color-bg, #faf8f5);
  color: var(--color-text, #3d3236);
  outline: none;
  transition: border-color 0.2s ease;
}

.chat-input:focus {
  border-color: var(--color-primary, #C4A8B0);
}

.chat-input::placeholder {
  color: #b5aaaa;
}

.chat-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.chat-mic {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--color-white, #fff);
  border: 1px solid var(--color-neutral, #e0d6d8);
  color: var(--color-deep, #8B6F72);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.chat-mic:hover:not(:disabled) {
  border-color: var(--color-primary, #C4A8B0);
  color: var(--color-primary, #C4A8B0);
}

.chat-mic.active {
  background: var(--color-primary, #C4A8B0);
  border-color: var(--color-primary, #C4A8B0);
  color: white;
}

.chat-send {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--color-deep, #8B6F72);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
  border: none;
  cursor: pointer;
}

.chat-send:hover:not(:disabled) {
  background: var(--color-text, #3d3236);
  transform: scale(1.05);
}

.chat-send:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.chat-toggle {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--color-deep, #8B6F72), var(--color-primary, #C4A8B0));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 30px rgba(139, 111, 114, 0.35);
  transition: all 0.35s ease;
  border: none;
  cursor: pointer;
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
}
</style>