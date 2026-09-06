// AIService: optional LLM (Nara Router) fallback, isolated behind this module.
//
// SECURITY: the browser NEVER holds or receives the API key. AI is only used
// through a server-side proxy endpoint (e.g. Vite dev proxy `/api/nara`)
// that injects the Authorization header using a NON-VITE_ env var, so the key
// never lands in the client bundle. In production with no server-side proxy,
// this service simply reports "not available" and the app continues locally.
//
// Every failure path returns null with no exception surfacing to the UI.

import { genericFallback, followUp } from './fallback-service.js'
import { detectLanguage, normalizeText } from './text-utils.js'
import knowledgeBase from '../data/knowledge-base.json'

const MAX_PROMPT_LENGTH = 500
const TIMEOUT_MS = 8000
const MODEL = 'laguna-s-2.1'

const ENDPOINT = '/api/nara/v1/chat/completions'

// environment check: only attempt when we are in a context that may have a
// server-side proxy (dev server). Non-VITE_ env vars are never bundled.
//
// LOCAL-ONLY MODE: external AI is disabled by default so the assistant is a
// fully self-contained, offline system (zero Nara/API calls). To re-enable the
// optional Nara fallback for local development, flip LOCAL_ONLY_MODE to false.
const LOCAL_ONLY_MODE = false

const AI_ENABLED =
  !LOCAL_ONLY_MODE &&
  typeof import.meta !== 'undefined' &&
  import.meta.env &&
  import.meta.env.DEV === true

let sessionAICount = 0
const SESSION_LIMIT = 10

// In-memory buster so repeated identical calls during one session cache well
const queryCache = new Map()
const CACHE_MAX = 50

/**
 * Builds a compact system prompt from only the relevant knowledge category,
 * plus the full intent flagged by the local engine (if any).
 */
function buildContext(category, intentId) {
  const intents = knowledgeBase.intents || []
  const selected =
    intents.filter((i) => i.category === category || i.id === intentId).slice(0, 2)
  if (selected.length === 0) return ''
  return selected
    .map((i) => {
      const en = i.answer.en || i.answer.ar || ''
      return `${i.id}: ${en}`
    })
    .join('\n\n')
}

/**
 * Detects the reply language instruction from the user's own words.
 * Arabic → Arabic, Egyptian markers → Egyptian Arabic, Gulf markers → a
 * natural Gulf conversational tone in Arabic, otherwise English.
 */
function promptLanguage(userText, lang) {
  if (lang !== 'ar') return 'English.'
  const n = ` ${normalizeText(userText || '')} `
  const has = (...words) => words.some((w) => n.includes(` ${normalizeText(w)} `))
  if (has('شنو', 'ابغى', 'ابي', 'وين', 'منو', 'شلون', 'وش', 'تكفى', 'زين')) {
    return 'Arabic, preserving a natural Gulf conversational tone.'
  }
  if (has('عايز', 'عايزة', 'ازاي', 'دلوقتي', 'فين', 'وريني', 'مصري', 'بقى')) {
    return 'Egyptian Arabic.'
  }
  return 'Arabic (Egyptian-friendly).'
}

function validPrompt(userText) {
  return typeof userText === 'string' && userText.trim().length > 0 && userText.trim().length <= MAX_PROMPT_LENGTH
}

function renderLocalContext(localContext) {
  if (!Array.isArray(localContext) || localContext.length === 0) return ''
  const lines = localContext
    .filter((c) => c && (c.intent || c.content))
    .slice(0, 2)
    .map((c) => {
      const topic = c.topic ? ` (topic: ${c.topic})` : ''
      return `- ${c.intent || 'unknown'}${topic}: ${c.content || ''}`.trim()
    })
  return lines.length > 0 ? lines.join('\n') : ''
}

/**
 * Attempts an AI answer for an open-ended question the local engine could
 * not answer confidently. Pure fallback: returns { answer } on success, or
 * null on ANY failure/timeout so the caller falls back to local content.
 * Never throws. Never touches any secret: authorization is injected by the
 * server-side proxy, so no key exists anywhere in this module.
 */
export async function getAIAnswer(
  userText,
  { category = null, intentId = null, localContext = null, memory = null, timeoutMs = TIMEOUT_MS } = {}
) {
  // No secret in the browser -> only works via a server proxy while developing.
  if (!AI_ENABLED) return null

  if (!validPrompt(userText)) return null
  if (sessionAICount >= SESSION_LIMIT) return null

  const cacheKey = `${category}:${userText.trim().toLowerCase()}`
  if (queryCache.has(cacheKey)) {
    return { answer: queryCache.get(cacheKey), fromCache: true }
  }

  const lang = detectLanguage(userText)
  const systemHint = buildContext(category, intentId)
  const contextBlock = renderLocalContext(localContext)
  const memoryBlock =
    memory && (memory.lastIntent || memory.lastTopic)
      ? `Recent conversation: intent=${memory.lastIntent || 'none'}, topic=${memory.lastTopic || 'none'}.`
      : ''
  const systemPrompt =
    'You are the friendly AI fallback layer inside Shymaa Raouf Ali\'s portfolio assistant. ' +
    'The local knowledge below is AUTHORITATIVE for anything about Shymaa: use it, never contradict it, and never invent clients, projects, jobs, years of experience, certifications, metrics, employment history, or banking experience. ' +
    'If the provided knowledge does not contain a Shymaa-specific fact being asked for, say the information is not available instead of fabricating it. ' +
    'General questions unrelated to Shymaa may be answered naturally and helpfully. ' +
    'Reply in this language: ' +
    promptLanguage(userText, lang) +
    ' Be concise and conversational, like the same assistant continuing naturally. ' +
    'Never claim to be a language model, never apologize with AI disclaimers, and never mention internal systems, retrieval, knowledge bases, routing, APIs, confidence, or fallback layers.' +
    (systemHint ? `\n\nVerified knowledge:\n${systemHint}` : '') +
    (contextBlock ? `\n\nClosest local context:\n${contextBlock}` : '') +
    (memoryBlock ? `\n\n${memoryBlock}` : '')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.7,
        max_tokens: 300,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userText.trim() },
        ],
      }),
    })

    if (!res.ok) {
      // 400/401/403/404/429/500 ... never expose; just disable for the session.
      if (res.status === 402 || res.status === 403 || res.status === 429) {
        sessionAICount = SESSION_LIMIT
      } else if (res.status >= 500) {
        sessionAICount = SESSION_LIMIT
      }
      return null
    }

    const data = await res.json()
    const answer = data?.choices?.[0]?.message?.content
    if (!answer) {
      // Empty/broken response -> disable for session is too harsh; just null.
      return null
    }

    sessionAICount += 1
    const trimmed = answer.trim()
    if (queryCache.size >= CACHE_MAX) {
      const key = queryCache.keys().next().value
      queryCache.delete(key)
    }
    queryCache.set(cacheKey, trimmed)
    return { answer: trimmed }
  } catch {
    // network failure / timeout / CORS / offline -> graceful local fallback
    return null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Public helper returning a safe, neutral response if the AI path is off.
 * Kept separate so the assistant engine owns the policy.
 */
export { genericFallback, followUp }

export default { getAIAnswer, validPrompt }
