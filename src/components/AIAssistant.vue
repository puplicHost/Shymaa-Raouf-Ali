<template>
  <div class="ai-assistant">
    <Transition name="chat">
      <div v-if="isOpen" class="chat-window">
        <div class="chat-header">
          <div class="chat-avatar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"/>
            </svg>
          </div>
          <div class="chat-header-text">
            <span class="chat-title">Ask about Shymaa</span>
            <span class="chat-status">AI Assistant</span>
          </div>
          <button class="chat-close" @click="isOpen = false" aria-label="Close chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="chat-messages" ref="messagesContainer">
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

        <div class="chat-input-area">
          <input
            v-model="userInput"
            @keyup.enter="sendMessage"
            placeholder="Type your question..."
            class="chat-input"
            :disabled="isTyping"
          />
          <button class="chat-send" @click="sendMessage" :disabled="!userInput.trim() || isTyping">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
          </button>
        </div>
      </div>
    </Transition>

    <button class="chat-toggle" @click="isOpen = !isOpen" :aria-label="isOpen ? 'Close chat' : 'Open chat'">
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
import { ref, nextTick, watch } from 'vue'
import { searchKnowledgeBase } from '../utils/similarity'
import knowledgeBase from '../data/knowledge-base.json'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''

const SYSTEM_PROMPT = `You are the AI assistant on Shymaa Raouf Ali's portfolio website.
Your only job is to answer questions about Shymaa — her skills, experience, work, and how to contact her.

RULES:
- Answer ONLY from the knowledge base below
- Never invent information not in the knowledge base
- Be warm, concise, and professional
- Reply in the same language the visitor uses (Arabic or English)
- If asked something outside the knowledge base, say: "I don't have details on that — you can reach Shymaa directly at raoufshimaa587@gmail.com"
- Never discuss other topics outside Shymaa's portfolio

KNOWLEDGE BASE:
Name: ${knowledgeBase.identity.name}
Title: ${knowledgeBase.identity.title}
Location: ${knowledgeBase.identity.location}
Focus: ${knowledgeBase.identity.focus}
Email: ${knowledgeBase.identity.email}
Phone: ${knowledgeBase.identity.tel}
Languages: ${knowledgeBase.identity.languages.join(', ')}

Experience: ${knowledgeBase.experience.years} years. Currently: ${knowledgeBase.experience.current_role} since ${knowledgeBase.experience.start_date}.
Previous: ${knowledgeBase.experience.previous_role}
Responsibilities: ${knowledgeBase.experience.responsibilities.join('; ')}

Education: ${knowledgeBase.education.degree} from ${knowledgeBase.education.university} (${knowledgeBase.education.year}), grade: ${knowledgeBase.education.grade}

Skills: ${knowledgeBase.skills.join(', ')}

Content Types: ${knowledgeBase.content_types.join(', ')}

Industries: ${knowledgeBase.industries.join(', ')}

Projects: ${knowledgeBase.projects.map((p) => `${p.name} (${p.industry}) - ${p.link}`).join('; ')}

Certifications: ${knowledgeBase.certifications.join(', ')}

Approach: ${knowledgeBase.approach.join('. ')}

What makes her different: ${knowledgeBase.what_makes_her_different}`

const isOpen = ref(false)
const userInput = ref('')
const isTyping = ref(false)
const messagesContainer = ref(null)

const messages = ref([
  {
    role: 'assistant',
    text: "Hi! I'm Shymaa's AI assistant. Ask me anything about her skills, experience, or work!",
  },
])

function formatMessage(text) {
  return text
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
}

async function callGeminiAPI(userQuestion) {
  if (!GEMINI_API_KEY || !GEMINI_API_KEY.startsWith('AIzaSy')) {
    return "I can help with questions about Shymaa's skills, experience, and work. For detailed inquiries, please reach out directly at raoufshimaa587@gmail.com"
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents: [
            { role: 'user', parts: [{ text: userQuestion }] },
          ],
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const msg = errorData?.error?.message || response.status
      console.error('Gemini API error:', msg)
      if (response.status === 400 || response.status === 403) {
        return "The AI service is not configured correctly. Please contact Shymaa directly at raoufshimaa587@gmail.com"
      }
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text
    }

    return "I'm having trouble processing that right now. Please try again or contact Shymaa directly at raoufshimaa587@gmail.com"
  } catch (error) {
    console.error('Gemini API error:', error)
    return "I'm having trouble connecting right now. For questions about Shymaa, please reach out at raoufshimaa587@gmail.com"
  }
}

async function getResponse(input) {
  const localResult = searchKnowledgeBase(input, knowledgeBase)

  if (localResult.found) {
    return localResult.answer
  }

  const geminiAnswer = await callGeminiAPI(input)
  return geminiAnswer
}

async function sendMessage() {
  const text = userInput.value.trim()
  if (!text || isTyping.value) return

  messages.value.push({ role: 'user', text })
  userInput.value = ''
  isTyping.value = true

  await nextTick()
  scrollToBottom()

  try {
    const response = await getResponse(text)
    messages.value.push({ role: 'assistant', text: response })
  } catch {
    messages.value.push({
      role: 'assistant',
      text: "Sorry, something went wrong. Please try again or contact Shymaa at raoufshimaa587@gmail.com",
    })
  } finally {
    isTyping.value = false
    await nextTick()
    scrollToBottom()
  }
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
  max-height: 520px;
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

/* Transitions */
.chat-enter-active { transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1); }
.chat-leave-active { transition: all 0.25s ease; }
.chat-enter-from { opacity: 0; transform: translateY(12px) scale(0.95); }
.chat-leave-to { opacity: 0; transform: translateY(8px) scale(0.97); }

.icon-enter-active { transition: all 0.2s ease; }
.icon-leave-active { transition: all 0.15s ease; }
.icon-enter-from { opacity: 0; transform: rotate(-90deg) scale(0.8); }
.icon-leave-to { opacity: 0; transform: rotate(90deg) scale(0.8); }

@media (max-width: 480px) {
  .ai-assistant {
    bottom: 1.25rem;
    right: 1.25rem;
  }

  .chat-window {
    width: calc(100vw - 2.5rem);
    right: 0;
    max-height: 420px;
  }
}
</style>
