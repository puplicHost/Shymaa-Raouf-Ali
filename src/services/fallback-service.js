// FallbackService: safe, natural, portfolio-oriented fallbacks.
// These are shown ONLY when the local engine has no confident answer AND the
// optional AI fallback is not available / failed. They never expose technical
// failures and never leave the user empty-handed.

import { detectLanguage } from './text-utils.js'

const FOLLOW_UP_AR = [
  'ممكن أعرفك أكتر عن شيماء من خلال خبرتها، مهاراتها، مشاريعها، وطريقة شغلها. تحب تعرف عن أنهي جزء؟',
  'تقدر تسألني عن مهارات شيماء، مشاريعها، دراسات الحالة، أو إزاي تشتغل. تحب نبدأ منين؟',
]

const FOLLOW_UP_EN = [
  "I can tell you more about Shymaa through her experience, skills, projects, and the way she works. What would you like to know about?",
  "You can ask me about Shymaa's skills, projects, case studies, or how she approaches social media. Where shall we start?",
]

const SUPPORTED_QUESTIONS_AR = 'تقدر تسألني: مين شيماء؟ مهاراتها إيه؟ وريني مشاريعها؟ شغلت فين؟ أو عايز أشتغل معاها.'
const SUPPORTED_QUESTIONS_EN = 'You can ask: Who is Shymaa? What are her skills? Show me her projects? Which industries has she worked with? Or how to contact her.'

/**
 * Returns a natural, safe fallback response in the detected language.
 * Never mentions AI, APIs, or any technical failure.
 */
export function genericFallback(query) {
  const lang = detectLanguage(query) || 'en'
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
  const base = lang === 'ar' ? pick(FOLLOW_UP_AR) : pick(FOLLOW_UP_EN)
  const support = lang === 'ar' ? SUPPORTED_QUESTIONS_AR : SUPPORTED_QUESTIONS_EN
  return `${base}\n\n${support}`
}

/**
 * A short, friendly conversational follow-up used after a successful answer.
 */
export function followUp(lang) {
  const options =
    lang === 'ar'
      ? [
          'تحب تعرف عن مشاريع شيماء؟',
          'ممكن كمان أوريك الـ Case Studies.',
          'تحب تعرف مهاراتها أو إزاي بتشتغل؟',
        ]
      : [
          'Would you like to know about Shymaa\'s projects?',
          'I can also show you the case studies.',
          'Care to learn about her skills or how she works?',
        ]
  return options[Math.floor(Math.random() * options.length)]
}

export default { genericFallback, followUp }
