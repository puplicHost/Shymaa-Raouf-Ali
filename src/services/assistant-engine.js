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

import { findLocalAnswer, pickAnswerVariation, resetLastReply } from './local-knowledge-engine.js'
import { detectLanguage, normalizeText, preprocessQuery } from './text-utils.js'
import { getAIAnswer, genericFallback, followUp } from './ai-service.js'
import { executeAction } from './interaction-engine.js'
import { detectConversation } from './conversation-service.js'
import knowledgeBase from '../data/knowledge-base.json'
import { portfolioData } from '../data/portfolio-data.js'

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
  lastIntentId = null
  lastTopic = null
  resetLastReply()
}

function trackRecentIntent(intentId) {
  if (!intentId) return
  recentIntentIds = recentIntentIds.filter((id) => id !== intentId)
  recentIntentIds.push(intentId)
  if (recentIntentIds.length > RECENT_LIMIT) recentIntentIds.shift()
}

// Maps portfolio section ids (portfolioData.navigation) to knowledge-base
// intent ids so navigation commands can reuse follow-up suggestions.
const SECTION_TO_INTENT = {
  about: 'identity',
  skills: 'skills',
  experience: 'experience',
  work: 'projects',
  industries: 'industries',
  approach: 'approach',
  certifications: 'certifications',
  contact: 'contact',
}

/**
 * Matches explicit navigation commands ("روح للتعريف", "go to about", ...)
 * against portfolioData.navigation phrases. Longest-phrase wins; matching is
 * done on normalized text with padding so short phrases like "top" never hit
 * inside longer words ("stop"). Returns { key, entry } or null.
 *
 * Command-likeness guard: a bare topic phrase ("خبرة شيماء") must not hijack
 * a longer real question ("عايز أعرف خبرة شيماء في الأثاث؟") — the input may
 * carry at most one extra meaningful token beyond the matched phrase,
 * otherwise it falls through to the local knowledge engine.
 */
export function matchNavigationCommand(input) {
  const norm = ` ${normalizeText(input || '')} `
  if (!norm.trim()) return null
  const inputTokens = preprocessQuery(input).tokens.length
  let best = null
  for (const [key, entry] of Object.entries(portfolioData.navigation || {})) {
    for (const phrase of entry.phrases || []) {
      const p = normalizeText(phrase || '')
      if (!p) continue
      if (norm.includes(` ${p} `) && (!best || p.length > best.phrase.length)) {
        best = { key, entry, phrase: p }
      }
    }
  }
  if (!best) return null
  const phraseTokens = preprocessQuery(best.phrase).tokens.length
  if (inputTokens > phraseTokens + 1) return null
  return best
}

/**
 * Session-level conversation memory: the last answered intent plus an optional
 * topic keyword (e.g. "furniture", "banking") extracted from the user's own
 * words. Lets short continuations ("طب في الأثاث؟", "and furniture?") resolve
 * to the running topic when the direct local match is weak. Reset with
 * resetRateLimit() so every test starts from a clean conversation state.
 */
let lastIntentId = null
let lastTopic = null

// Concrete topic keywords (raw forms; normalized once at load so matching
// against normalized query tokens is exact).
const TOPIC_KEYWORDS_RAW = {
  furniture: ['أثاث', 'furniture'],
  banking: ['بنوك', 'بنك', 'banking', 'bank'],
  education: ['تعليم', 'education', 'school'],
  marble: ['رخام', 'marble'],
  pharmacy: ['صيدلي', 'صيدلية', 'صيدليات', 'pharmacy', 'healthcare'],
  cleaning: ['تنظيف', 'cleaning'],
  ecommerce: ['تجارة', 'ecommerce', 'e-commerce', 'online'],
  saudi: ['سعودي', 'saudi'],
}

const TOPIC_LOOKUP = (() => {
  const map = new Map()
  for (const [topic, words] of Object.entries(TOPIC_KEYWORDS_RAW)) {
    for (const w of words) map.set(normalizeText(w), topic)
  }
  return map
})()

// Continuation cues: the current message only makes sense with prior context.
// Matched as whole words on normalized text (never substrings).
const CONTEXT_CUES = [
  'طب', 'ده', 'دا', 'دي', 'ديه', 'هذا', 'هذه', 'كمان', 'برضه',
  'بالنسبه', 'بالنسبة', 'وايه', 'طيب',
  'and', 'also', 'it', 'that', 'this', 'those', 'these',
]

function extractTopic(tokens) {
  for (const raw of tokens || []) {
    // Tokens may carry the definite article (الاثاث) or a trailing ؟ —
    // both are stripped so "الأثاث؟" still maps to the furniture topic.
    const clean = String(raw || '').replace(/[^\p{L}\p{N}]+$/gu, '')
    const hit = TOPIC_LOOKUP.get(clean) || TOPIC_LOOKUP.get(stripArabicPrefix(clean))
    if (hit) return hit
  }
  return null
}

function stripArabicPrefix(t) {
  for (const p of ['وال', 'بال', 'كال', 'فال', 'لل', 'ال']) {
    if (t.startsWith(p) && t.length > p.length + 2) return t.slice(p.length)
  }
  return t
}

function hasContinuationCue(input) {
  const norm = ` ${normalizeText(input || '')} `
  return CONTEXT_CUES.some((c) => norm.includes(` ${normalizeText(c)} `))
}

function updateContextMemory(intentId, tokens) {
  lastIntentId = intentId || null
  lastTopic = extractTopic(tokens)
}

/**
 * Resolves a pronoun-like continuation to the stored conversation topic.
 * Only fires when: a topic is remembered AND the message carries a
 * continuation cue AND the direct local search found nothing (caller
 * guarantees the last condition). Returns the stored intent or null.
 */
export function resolveContextFollowUp(input) {
  if (!lastTopic || !lastIntentId) return null
  if (!hasContinuationCue(input)) return null
  return (knowledgeBase.intents || []).find((i) => i.id === lastIntentId) || null
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
  experience: { ar: '💼 شيماء اشتغلت فين؟', en: '💼 Where has she worked?' },
  certifications: { ar: '🎓 إيه شهاداتها؟', en: '🎓 What certifications does she hold?' },
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
    // 0a) Explicit navigation commands ("روح للتعريف", "go to about", ...).
    //     Checked before everything else: an explicit scroll command is never
    //     a portfolio question, so it resolves directly with a confirmation.
    const nav = matchNavigationCommand(input)
    if (nav) {
      const action = { type: 'scroll', target: nav.entry.sectionId, label: nav.key }
      executeAction(action)
      const navIntentId = SECTION_TO_INTENT[nav.entry.sectionId] || null
      if (navIntentId) trackRecentIntent(navIntentId)
      return {
        answer: lang === 'ar'
          ? (nav.entry.response || nav.entry.responseEn)
          : (nav.entry.responseEn || nav.entry.response),
        action,
        followUps: navIntentId ? getFollowUps(navIntentId, lang, recentIntentIds) : [],
        lang,
        intentId: navIntentId,
        source: 'navigation',
      }
    }

    // 0b) Everyday conversational inputs (greeting / thanks / ack) resolve
    //    first — they are not portfolio questions, so they never hit the
    //    intent engine nor produce follow-up suggestions.
    const conv = detectConversation(input)
    if (conv) {
      return {
        answer: conv.answer,
        action: null,
        followUps: [],
        lang: conv.lang,
        source: 'conversation',
      }
    }

    // 1) Local knowledge is the source of truth.
    const local = findLocalAnswer(input)
    if (local) {
      // Execute the interaction action from the verified local answer.
      if (local.action) executeAction(local.action)
      trackRecentIntent(local.intentId)
      updateContextMemory(local.intentId, preprocessQuery(input).tokens)
      return {
        answer: local.answer,
        action: local.action,
        followUps: getFollowUps(local.intentId, local.lang, recentIntentIds),
        lang: local.lang,
        intentId: local.intentId,
        source: 'local',
      }
    }

    // 1b) Contextual continuation ("طب في الأثاث؟", "and furniture?").
    //      Fires only on a local miss while a topic is remembered: the stored
    //      intent answers with a fresh variation, so short follow-ups keep the
    //      thread instead of falling back.
    const ctxIntent = resolveContextFollowUp(input)
    if (ctxIntent) {
      const ctxAction = ctxIntent.action || null
      if (ctxAction) executeAction(ctxAction)
      trackRecentIntent(ctxIntent.id)
      updateContextMemory(ctxIntent.id, preprocessQuery(input).tokens)
      return {
        answer: pickAnswerVariation(ctxIntent, lang),
        action: ctxAction,
        followUps: getFollowUps(ctxIntent.id, lang, recentIntentIds),
        lang,
        intentId: ctxIntent.id,
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

export default { process, canProcessInput, getFollowUp, getFollowUps, pickFollowUps, resetRateLimit, matchNavigationCommand, resolveContextFollowUp }
