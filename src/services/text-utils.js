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
  'هات', 'وريني', 'عايز', 'عايزة', 'حاضر',
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

/**
 * Normalizes Arabic text: strips diacritics/tatweel, folds alef variants,
 * ta marbuta and alef maqsura. For English, just lowercases.
 */
export function normalizeText(text) {
  let result = String(text || '').trim().toLowerCase()
  for (const [pattern, replacement] of ARABIC_NORMALIZATIONS) {
    result = result.replace(pattern, replacement)
  }
  return result.replace(/\s+/g, ' ').trim()
}

/**
 * Tokenizes text into normalized word tokens (length > 1).
 */
export function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1)
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
