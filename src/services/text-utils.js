// Shared text utilities for the local-first assistant.
// Centralizes Arabic/English normalization, tokenization, stop-word removal
// and language detection so the knowledge engine, interaction engine and
// assistant engine all behave consistently.

export const ARABIC_STOP_WORDS = new Set([
  'في', 'من', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'ذلك', 'تلك',
  'التي', 'الذي', 'الذين', 'اللذين', 'اللتين', 'هي', 'هو', 'هم', 'هن',
  'أنا', 'نحن', 'أنت', 'أنتم', 'أنتن', 'كان', 'كانت', 'يكون', 'تكون',
  'أن', 'إن', 'لا', 'ما', 'لم', 'لن', 'هل', 'قد', 'و', 'ف', 'ب', 'ل',
  'ك', 'تم', 'لم', 'يتم', 'بت', 'بتكون', 'بيكون', 'هيكون', 'كون',
  'شيء', 'ايه', 'ازاي', 'ليه', 'كام', 'وقت', 'فين', 'حد', 'طيب', 'بقى',
  'يعني', 'لوسمحت', 'لو سمحت', 'ممكن', 'إيه', 'دي', 'ده', 'بتاع', 'عند',
  'هات', 'وريني', 'عايز', 'عايزة', 'حاضر', 'إزاي', 'برضه', 'أهلا', 'اهلا', 'مرحبا',
  // Gulf interrogatives/function words (normalized forms; raw variants match pre-normalization too)
  'شنو', 'ايش', 'إيش', 'ليش', 'ابغي', 'أبغى', 'ابغى', 'ابي', 'أبي', 'وين', 'شلون', 'كيف', 'زين', 'وايد', 'وش', 'تكفي',
])

export const ENGLISH_STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
  'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over',
  'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when',
  'where', 'why', 'how', 'all', 'both', 'each', 'few', 'more', 'most',
  'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
  'so', 'than', 'too', 'very', 'just', 'don', 'now', 'what', 'which',
  'who', 'whom', 'this', 'that', 'these', 'those', 'i', 'me', 'my',
  'myself', 'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she',
  'her', 'it', 'its', 'they', 'them', 'their', 'about', 'up', 'please',
  'hey', 'hi', 'hello', 'me', 'show', 'tell',
])

const ARABIC_NORMALIZATIONS = [
  [/[\u0610-\u061A]/g, ''],
  [/\u0640/g, ''],
  [/[\u0622\u0623\u0625]/g, '\u0627'],
  [/\u0629/g, '\u0647'],
  [/\u0649/g, '\u064A'],
  [/\u064A\u0646/g, '\u064A'],
]

// Small, conservative shorthand expansion for the conversational inputs people
// actually type into a chat box (e.g. "info" -> "information", "u" -> "you").
// Kept tiny on purpose: normalization must never guess words it is not sure
// about, so only fixed, unambiguous whole-token forms are mapped and every
// replacement is word-boundary safe (no mangling inside longer words).
const COMMON_SHORTHAND = {
  info: 'information',
  'info.': 'information',
  u: 'you',
  ur: 'your',
  yr: 'your',
  plz: 'please',
  pls: 'please',
  thx: 'thanks',
  tnx: 'thanks',
  bc: 'because',
  bcz: 'because',
  coz: 'because',
  btw: 'by the way',
  wanna: 'want to',
  gimme: 'give me',
}

function expandShorthand(text) {
  let result = ` ${String(text || '').toLowerCase()} `
  for (const [key, value] of Object.entries(COMMON_SHORTHAND)) {
    const rx = new RegExp(`(^|[^\\p{L}\\p{N}])${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[^\\p{L}\\p{N}])`, 'gu')
    result = result.replace(rx, `$1${value}`)
  }
  return result.trim()
}

/**
 * Normalizes Arabic text: strips diacritics/tatweel, folds alef variants,
 * ta marbuta and alef maqsura. For English, just lowercases. Also expands a
 * tiny set of unambiguous shorthand forms and collapses punctuation/whitespace
 * so "contact info.", "u want info" and "info" all reach the same tokens.
 * Arabic-block punctuation (؟ ، ؛) is treated as a separator so tokens never
 * carry trailing marks ("البنوك؟" -> "البنوك").
 */
export function normalizeText(text) {
  let result = expandShorthand(text)
  result = result.replace(/[؟،؛]/g, ' ')
  result = result.replace(/[^\p{L}\p{N}\s\u0600-\u06FF]/gu, ' ')
  for (const [pattern, replacement] of ARABIC_NORMALIZATIONS) {
    result = result.replace(pattern, replacement)
  }
  return result.replace(/\s+/g, ' ').trim()
}

/**
 * Tokenizes text into normalized word tokens (length > 1).
 */
export function tokenize(text) {
  return normalizeText(text)
    .split(/\s+/)
    .filter((t) => t.length > 1)
}

// Words where a leading ال is radical (part of the word itself), never a
// detachable definite article. Listed in NORMALIZED form because stripping
// always runs on normalized tokens.
const ARTICLE_GUARD = new Set([
  'الله', 'اللهم', 'الذي', 'التي', 'الذين', 'اللذين', 'اللتين',
  'اللاتي', 'اللواتي', 'الان', 'الياس',
])

const ARTICLE_PREFIXES = ['وال', 'بال', 'كال', 'فال', 'لل', 'ال']

/**
 * Strips one Arabic definite-article prefix (ال، لل، بال، كال، وال، فال).
 * Conservative: guarded words are untouched and the remainder must keep at
 * least 2 characters, so بنك/البنك/بنوك/البنوك collapse while pronouns and
 * divine names (التي، الذي، الله) are preserved. Used for MATCHING
 * equivalence only — token streams themselves are never rewritten.
 */
export function stripDefiniteArticle(token) {
  const t = String(token || '')
  if (t.length < 4 || ARTICLE_GUARD.has(t)) return t
  for (const p of ARTICLE_PREFIXES) {
    if (t.startsWith(p) && t.length - p.length >= 2) {
      const rest = t.slice(p.length)
      if (!ARTICLE_GUARD.has(rest)) return rest
    }
  }
  return t
}

/**
 * Token equivalence for retrieval: identical, prefix-related (existing
 * behavior), or equal after article stripping (بنوك == البنوك).
 */
export function tokensEquivalent(a, b) {
  if (a === b) return true
  if (!a || !b) return false
  if (a.startsWith(b) || b.startsWith(a)) return true
  return stripDefiniteArticle(a) === stripDefiniteArticle(b)
}

/**
 * Detects whether the text is predominantly Arabic or English.
 */
export function detectLanguage(text) {
  const arabicChars = (String(text || '').match(/[\u0600-\u06FF]/g) || []).length
  const totalChars = String(text || '').replace(/\s/g, '').length
  if (totalChars === 0) return 'en'
  return arabicChars / totalChars > 0.3 ? 'ar' : 'en'
}

export function removeStopWords(tokens, lang) {
  const stops = lang === 'ar' ? ARABIC_STOP_WORDS : ENGLISH_STOP_WORDS
  return tokens.filter((t) => !stops.has(t))
}

/**
 * Preprocesses a query into normalized, stop-word-free tokens for the
 * detected language.
 */
export function preprocessQuery(query) {
  const lang = detectLanguage(query)
  return {
    lang,
    tokens: removeStopWords(tokenize(normalizeText(query)), lang),
  }
}
