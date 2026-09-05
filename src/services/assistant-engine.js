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

// Recently answered intents (in conversation order). Used by the follow-up
// picker so two consecutive answers never re-suggest the same section and the
// conversation keeps exploring instead of looping. Reset alongside the rate
// limit so every test starts from a clean conversation state.
const RECENT_LIMIT = 4
let recentIntentIds = []

/**
 * Resets the client-side cooldown state and the recent-intent history.
 * Primarily useful for tests; on the frontend the cooldown simply prevents
 * accidental duplicate sends.
 */
export function resetRateLimit() {
  lastRequestAt = 0
  processing = false
  recentIntentIds = []
}

function trackRecentIntent(intentId) {
  if (!intentId) return
  recentIntentIds = recentIntentIds.filter((id) => id !== intentId)
  recentIntentIds.push(intentId)
  if (recentIntentIds.length > RECENT_LIMIT) recentIntentIds.shift()
}

/**
 * Human-friendly fallback labels for follow-up suggestions that come from the
 * pool but are not the canonical first two of an intent. Kept in the KB sense:
 * every label still resolves through the normal local engine when clicked.
 */
const FALLBACK_LABELS = {
  identity: { ar: '🤍 مين هي شيماء؟', en: '🤍 Who is Shymaa?' },
  work: { ar: '💼 نوع الشغل اللي بتعمله؟', en: '💼 What type of work does she do?' },
  projects: { ar: '📈 وريني المشاريع', en: '📈 Show me the projects' },
  caseStudies: { ar: '📊 شاورلي دراسات الحالة', en: '📊 Tell me about the case studies' },
  education: { ar: '📚 شيماء بتتعلم إيه؟', en: '📚 What is she learning?' },
  skills: { ar: '💪 إيه مهاراتها؟', en: '💪 What are her skills?' },
  differentiator: { ar: '💡 إيه اللي بيميزها؟', en: '💡 What makes her different?' },
  contentTypes: { ar: '📱 إيه نوع المحتوى اللي بتعمله؟', en: '📱 What type of content does she create?' },
  industries: { ar: '🌍 اشتغلت في صناعات إيه؟', en: '🌍 Which industries has she worked in?' },
  approach: { ar: '🛠️ إزاي بتشتغل؟', en: '🛠️ How does she approach work?' },
  contact: { ar: '📧 عايز أتواصل معاها', en: '📧 I want to contact her' },
  availability: { ar: '📅 شيماء متاحة للشغل؟', en: '📅 Is Shymaa available for work?' },
}

/**
 * Deterministic follow-up picker. Always returns exactly two follow-ups for an
 * intent (intent-id + bilingual label):
 *   - with no prior context it returns the canonical KB pair unchanged,
 *   - with recent-intent history it avoids repeating just-answered sections
 *     (no self-loop, no immediate re-loop) and prefers topic diversity,
 *   - ordering stays stable so identical conversations give identical output.
 */
export function pickFollowUps(intentId, lang = 'en', recent = []) {
  if (!intentId) return []

  const intent = (knowledgeBase.intents || []).find((i) => i.id === intentId)
  if (!intent) return []

  // The canonical pair (kept deterministic and untouched whenever possible).
  const canonical = [...(intent.followUps || [])]
  if (!canonical.length) return []

  const sourceCategory = intent.category || ''
  const recentSet = new Set(recent.filter((id) => id && id !== intentId))

  // When there is no prior conversational context (or it only contains the
  // current intent), the canonical pair IS the answer — this preserves the
  // stable, previously-approved follow-up behaviour.
  if (recentSet.size === 0) {
    return canonical.map((f) => ({ intent: f.intent, label: (f.label && (f.label[lang] || f.label.en)) || '' }))
  }

  // Candidate pool: this intent's follow-up entries from the KB. The first
  // two entries mirror the canonical pair; extra entries provide substitute
  // suggestions so a recently-visited topic is replaced instead of repeated.
  const entries = (knowledgeBase.followUpPool || {})[intentId] || canonical

  const scored = entries
    // Never re-suggest the current intent itself, and hard-skip any
    // destination the user just visited (recent) — this is what keeps the
    // conversation exploring instead of looping.
    .filter((e) => e.intent && e.intent !== intentId && !recentSet.has(e.intent))
    .map((e, index) => {
      const target = (knowledgeBase.intents || []).find((i) => i.id === e.intent)
      const category = target ? target.category || '' : ''
      let score = index * 0.001 // deterministic, stable order tie-break
      if (category && category !== sourceCategory) score -= 0.5 // different topic -> preferred
      return { entry: e, score, category }
    })

  scored.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score
    return a.entry.intent.localeCompare(b.entry.intent)
  })

  // Fill from the deterministic global order if a pool ever runs short, so the
  // result is ALWAYS exactly two diverse follow-ups.
  const picked = scored.slice(0, 2).map((s) => s.entry)
  const fallbackOrder = Object.keys(FALLBACK_LABELS)
  for (const id of fallbackOrder) {
    if (picked.length >= 2) break
    if (id === intentId || recentSet.has(id)) continue
    if (picked.some((e) => e.intent === id)) continue
    if (scored.length > 0) {
      const target = (knowledgeBase.intents || []).find((i) => i.id === id)
      const category = target ? target.category || '' : ''
      if (category === sourceCategory) continue // prefer a different topic when we can
    }
    picked.push({ intent: id, label: FALLBACK_LABELS[id] })
  }

  return picked.map((e) => ({
    intent: e.intent,
    label: (e.label && (e.label[lang] || e.label.en)) || '',
  }))
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
 * language. Each follow-up references another intent by id (resolved on click
 * through the normal local engine), so there is no second answer system.
 *
 * `recent` is an optional ordered list of intent ids answered so far in this
 * conversation; when provided the picker avoids re-suggesting those sections
 * and favours topic diversity. Without it, the stable canonical pair from the
 * knowledge base is returned (unchanged behaviour).
 */
export function getFollowUps(intentId, lang = 'en', recent = []) {
  return pickFollowUps(intentId, lang, recent)
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
      trackRecentIntent(local.intentId)
      return {
        answer: local.answer,
        action: local.action,
        followUps: getFollowUps(local.intentId, local.lang, recentIntentIds),
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

export default { process, canProcessInput, getFollowUp, getFollowUps, pickFollowUps, resetRateLimit }
