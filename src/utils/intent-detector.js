import { portfolioData } from '../data/portfolio-data.js'

const ARABIC_STOP_WORDS = new Set([
  'في', 'من', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'ذلك', 'تلك',
  'التي', 'الذي', 'هي', 'هو', 'هم', 'أنا', 'نحن', 'أنت', 'كان',
  'كانت', 'لا', 'ما', 'لم', 'لن', 'هل', 'قد', 'و', 'ف', 'ب', 'ل',
  'ك', 'تم', 'يتم', 'بتكون', 'كون', 'طيب', 'بقى', 'يعني', 'لوسمحت',
  'لو سمحت', 'ممكن', 'คือ', 'acceptable',
])

const ENGLISH_STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'can', 'to', 'of', 'in', 'for', 'on',
  'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over',
  'under', 'again', 'then', 'once', 'here', 'there', 'when', 'where',
  'why', 'how', 'all', 'both', 'each', 'few', 'more', 'most', 'other',
  'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
  'than', 'too', 'very', 'just', 'don', 'now', 'what', 'which', 'who',
  'whom', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'we',
  'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'it', 'its',
  'they', 'them', 'their', 'about', 'up', 'please', 'hey', 'hi', 'hello',
])

const ARABIC_NORMALIZATIONS = [
  [/[\u0610-\u061A]/g, ''],
  [/\u0640/g, ''],
  [/[\u0622\u0623\u0625]/g, '\u0627'],
  [/\u0629/g, '\u0647'],
  [/\u0649/g, '\u064A'],
  [/\u064A\u0646/g, '\u064A'],
]

export function normalizeText(text) {
  let result = text.trim()
  for (const [pattern, replacement] of ARABIC_NORMALIZATIONS) {
    result = result.replace(pattern, replacement)
  }
  result = result.replace(/\s+/g, ' ').trim()
  return result
}

export function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1)
}

function removeStopWords(tokens, lang) {
  const stops = lang === 'ar' ? ARABIC_STOP_WORDS : ENGLISH_STOP_WORDS
  return tokens.filter((t) => !stops.has(t))
}

export function detectLanguage(text) {
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length
  const totalChars = text.replace(/\s/g, '').length
  if (totalChars === 0) return 'en'
  return arabicChars / totalChars > 0.3 ? 'ar' : 'en'
}

function matchPhrase(text, phrases) {
  const normalized = normalizeText(text).toLowerCase()
  for (const phrase of phrases) {
    const p = phrase.toLowerCase()
    if (normalized.includes(p) || p.includes(normalized)) {
      return true
    }
    const textTokens = new Set(tokenize(normalized))
    const phraseTokens = tokenize(p)
    const matches = phraseTokens.filter((t) => textTokens.has(t)).length
    if (phraseTokens.length > 0 && matches / phraseTokens.length >= 0.6) {
      return true
    }
  }
  return false
}

function detectNavigation(text) {
  const nav = portfolioData.navigation
  for (const [key, config] of Object.entries(nav)) {
    if (matchPhrase(text, config.phrases)) {
      return {
        type: 'navigate',
        target: key,
        sectionId: config.sectionId,
        response: detectLanguage(text) === 'ar' ? config.response : config.responseEn,
      }
    }
  }
  return null
}

function detectGreeting(text) {
  const normalized = normalizeText(text).toLowerCase()
  const greetings = ['مرحبا', 'اهلا', 'السلام عليكم', 'صباح الخير', 'مساء الخير', 'ازيك', 'عامل ايه', 'hello', 'hi', 'hey', 'good morning', 'good evening', 'how are you']
  return greetings.some((g) => normalized.includes(g))
}

export function detectIntent(text) {
  if (!text || text.trim().length < 2) {
    return { type: 'empty', response: null }
  }

  const normalized = normalizeText(text)

  const navResult = detectNavigation(normalized)
  if (navResult) return navResult

  if (detectGreeting(normalized)) {
    const lang = detectLanguage(text)
    return {
      type: 'greeting',
      response: lang === 'ar'
        ? 'مرحباً! أنا مساعد شيماء الذكي. اسأل عن مهاراتها أو خبراتها أو مشاريعها.'
        : "Hello! I'm Shymaa's AI assistant. Ask about her skills, experience, or projects.",
    }
  }

  return { type: 'unknown', response: null }
}

export function executeNavigation(sectionId) {
  const el = document.getElementById(sectionId)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    el.classList.add('highlight-section')
    setTimeout(() => el.classList.remove('highlight-section'), 2000)
    return true
  }
  return false
}
