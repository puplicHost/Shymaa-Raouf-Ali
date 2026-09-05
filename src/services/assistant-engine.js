// AssistantEngine: the single orchestration seam for the portfolio assistant.
//
//   process(userInput)
//     -> normalize
//     -> detect intent / local search  (LocalKnowledgeEngine)
//     -> matched?  -> local answer (source of truth, no AI call)
//     -> else     -> optional AI fallback (AIService)
//     -> AI fail  -> safe fallback (FallbackService)
//     -> resolve & return interaction action
//
// The UI component never holds this business logic.

import { findLocalAnswer } from './local-knowledge-engine.js'
import { detectLanguage, preprocessQuery } from './text-utils.js'
import { getAIAnswer, genericFallback, followUp } from './ai-service.js'
import { executeAction } from './interaction-engine.js'
import knowledgeBase from '../data/knowledge-base.json'

const MAX_INPUT_LENGTH = 500
const COOLDOWN_MS = 1200

// LOCAL-ONLY MODE: the assistant never calls Nara or any external AI API.
// The pipeline is: local knowledge engine -> local answer -> action -> follow-ups.
// To re-enable the optional AI fallback (local dev only), set this to false.
const LOCAL_ONLY_MODE = true

let lastRequestAt = 0
let processing = false

/**
 * Resets the client-side cooldown state. Primarily useful for tests; on the
 * frontend the cooldown simply prevents accidental duplicate sends.
 */
export function resetRateLimit() {
  lastRequestAt = 0
  processing = false
}

/**
 * Guards a user input before processing:
 *  - enforces a max length (client-side)
 *  - enforces a per-request cooldown (local questions are unlimited, but we
 *    prevent accidental double-fire / auto-duplicate floods)
 */
export function canProcessInput(text) {
  if (!text || typeof text.trim !== 'function') return false
  const trimmed = text.trim()
  if (trimmed.length === 0) return false
  if (trimmed.length > MAX_INPUT_LENGTH) return false
  if (processing) return false
  const now = Date.now()
  if (now - lastRequestAt < COOLDOWN_MS) return false
  return true
}

function detectIntentName(text) {
  const quick = text.trim().toLowerCase()
  if (/^(مين|من هي|عرفني|من شيماء|who is|tell me about|introduce)/.test(quick)) return 'identity'
  if (/(مشاريع|وريني|شوف شغلها|projects|show me.*work|portfolio)/.test(quick)) return 'projects'
  if (/(مهارات|skills)/.test(quick)) return 'skills'
  if (/(مجالات|industries|اشتغلت|worked)/.test(quick)) return 'industries'
  if (/(بيميز|مختلفة|مميز|different|unique)/.test(quick)) return 'differentiator'
  if (/(تواصل|أتواصل|اتصال|contact|تواصل مع)/.test(quick)) return 'contact'
  if (/(إزاي بتشتغل|طريقة|approach|how.*work)/.test(quick)) return 'approach'
  return 'unknown'
}

/**
 * Resolves the contextual follow-up suggestions for an intent in the given
 * language, straight from the knowledge base. Each follow-up references
 * another intent by id (resolved on click through the normal local engine),
 * so there is no second answer system.
 */
export function getFollowUps(intentId, lang = 'en') {
  if (!intentId) return []
  const intent = (knowledgeBase.intents || []).find((i) => i.id === intentId)
  const followUps = intent && Array.isArray(intent.followUps) ? intent.followUps : []
  return followUps
    .map((f) => ({
      label: (f.label && (f.label[lang] || f.label.en)) || '',
      intent: f.intent,
    }))
    .filter((f) => f.label && f.intent)
}

/**
 * The core pipeline. Returns a fully-resolved assistant result with:
 *   { answer, action, followUps, lang, source, intentId }
 * and, as a side effect, executes the resolved portfolio action.
 *
 * In LOCAL-ONLY mode the external AI service is never called: a local answer
 * (with its contextual follow-ups) or the safe local fallback is returned.
 *
 * Never throws. Never exposes technical errors to the user.
 */
export async function process(inputText) {
  const input = (inputText || '').trim()
  const lang = detectLanguage(input)

  if (!canProcessInput(input)) {
    return {
      answer: genericFallback(input),
      action: null,
      followUps: [],
      lang,
      source: 'cooldown',
    }
  }

  processing = true
  lastRequestAt = Date.now()

  try {
    // 1) Local knowledge is the source of truth.
    const local = findLocalAnswer(input)
    if (local) {
      // Execute the interaction action from the verified local answer.
      if (local.action) executeAction(local.action)
      return {
        answer: local.answer,
        action: local.action,
        followUps: getFollowUps(local.intentId, local.lang),
        lang: local.lang,
        intentId: local.intentId,
        source: 'local',
      }
    }

    // 2) Optional AI fallback — OFF in Local-Only mode. Re-enable by setting
    //    LOCAL_ONLY_MODE to false above (AI is dev-proxy-only and never overrides
    //    a verified local answer).
    if (!LOCAL_ONLY_MODE) {
      const intentGuess = detectIntentName(input)
      const ai = await getAIAnswer(input, {
        category: intentGuess === 'unknown' ? null : intentGuess,
        intentId: intentGuess === 'unknown' ? null : intentGuess,
      })

      if (ai && ai.answer && ai.answer.trim()) {
        return {
          answer: ai.answer,
          action: null,
          followUps: [],
          lang,
          intentId: intentGuess,
          source: 'ai',
        }
      }
    }

    // 3) Safe local fallback when AI is unavailable/failed/disabled.
    return {
      answer: genericFallback(input),
      action: null,
      followUps: [],
      lang,
      source: 'fallback',
    }
  } finally {
    processing = false
  }
}

/**
 * Returns a friendly conversational follow-up for the detected language.
 */
export function getFollowUp(text) {
  return followUp(detectLanguage(text))
}

export { preprocessQuery, detectLanguage }

export default { process, canProcessInput, getFollowUp, getFollowUps, resetRateLimit }
