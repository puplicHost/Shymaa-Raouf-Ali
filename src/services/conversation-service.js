// ConversationService: handles the small set of everyday conversational inputs
// — greetings, thanks, and acknowledgments — so they never leak into the
// portfolio intent engine or the fallback. Each returns a short, warm response
// in the detected language with NO follow-up suggestions (they are not
// navigational questions).
//
// Detection is deliberately narrow and anchored, so portfolio questions that
// merely mention a courtesy word (e.g. "can you thank her clients?") are never
// misread as small talk.

import { detectLanguage, normalizeText } from './text-utils.js'

const GREETING_EN = [
  "Hello! I'm here to help you explore Shymaa's work.",
  "Hi there! Ask me about Shymaa's experience, skills, projects, or how to reach her.",
]
const GREETING_AR = [
  'أهلاً بيك! أنا هنا عشان أساعدك تتعرف على شيماء وعملها.',
  'مرحباً! تقدر تسألني عن خبرة شيماء، مهاراتها، مشاريعها، أو إزاي تتواصل معاها.',
]
const THANKS_EN = [
  "You're welcome! Feel free to ask about anything else.",
  "Anytime! I'm happy to help — just ask.",
]
const THANKS_AR = [
  'العفو! لو محتاج حاجة تانية دوس يا فندم.',
  'العفو! تحت أمرك في أي وقت.',
]
const ACK_EN = [
  'Got it! What would you like to explore next?',
  'Sounds good! Just let me know what you want to know about Shymaa.',
]
const ACK_AR = [
  'تمام! تحب تكمّل في أنهي جزء؟',
  'حلو! قول لي عايز تعرف إيه عن شيماء.',
]

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

// Anchored EN patterns — match the courtesy expression in isolation even when
// surrounded by punctuation, but not inside an unrelated longer word.
const GREET_EN = /^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening))[!,.?\s]*$/i
const THANK_EN = /^(thank\s*(you|u|ya)|thanks|thx|tysm|ty|much\s*appreciated)[!,.?\s]*$/i
const ACK_EN_RX = /^(ok|okay|okie|got\s*it|understood|fine|great|cool|nice|awesome|perfect|sure|alright|roger|you are welcome|welcome|no problem|np|sounds good|alrighty)[!,.?\s]*$/i

// Anchored AR patterns (normalized: alef/hamza folded by normalizeText).
const GREET_AR = /^(اهلا|اهلين|مرحبا|مرحبتين|سلام|ازيك|ازيكم|هاي|هلا|يا هلا|صباح الخير|مساء الخير)$/i
const THANK_AR = /^(شكرا|شكرا جدا|شكرا ليك|شكرا ليكم|متشكر|تسلم|تسلمي|يعطيك العافية|ميرسي|ثانكس)$/i
const ACK_AR_RX = /^(تمام|حلو|تمام جدا|جميل|اوكي|اوك|ماشي|حاضر|برافو|كويس|عاش|هايل)$/i

function matched(raw, enRx, arRx) {
  const n = normalizeText(raw.trim())
  if (enRx.test(n)) return 'en'
  if (arRx.test(n)) return 'ar'
  return null
}

/**
 * Detects a conversational input (greeting / thanks / acknowledgment).
 * Returns { type, answer, lang } or null when it is not small talk, so the
 * caller can fall through to the portfolio engine.
 */
export function detectConversation(input) {
  if (!input || typeof input.trim !== 'function') return null
  const lang = detectLanguage(input) || 'en'

  const greetingLang = matched(input, GREET_EN, GREET_AR)
  if (greetingLang) {
    return {
      type: 'greeting',
      answer: greetingLang === 'ar' ? pick(GREETING_AR) : pick(GREETING_EN),
      lang: greetingLang,
    }
  }

  const thankLang = matched(input, THANK_EN, THANK_AR)
  if (thankLang) {
    return {
      type: 'thanks',
      answer: thankLang === 'ar' ? pick(THANKS_AR) : pick(THANKS_EN),
      lang: thankLang,
    }
  }

  const ackLang = matched(input, ACK_EN_RX, ACK_AR_RX)
  if (ackLang) {
    return {
      type: 'ack',
      answer: ackLang === 'ar' ? pick(ACK_AR) : pick(ACK_EN),
      lang: ackLang,
    }
  }

  // Fall back to the single-language heuristic already computed (harmless).
  void lang
  return null
}

export default { detectConversation }
