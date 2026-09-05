// InteractionEngine: turns a resolved action into real UI behavior.
// Reuses the app's existing section IDs and navigation patterns rather than
// inventing duplicate logic.

const EMAIL = 'raoufshimaa587@gmail.com'
const PHONE = '+201282354052'
const LINKEDIN = 'https://www.linkedin.com/in/shymaa-raouf-ali'
const WHATSAPP = '201282354052'

export const SECTION_IDS = {
  hero: 'hero',
  about: 'about',
  skills: 'skills',
  work: 'work',
  industries: 'industries',
  approach: 'approach',
  certifications: 'certifications',
  contact: 'contact',
}

function scrollToSection(sectionId) {
  const el = document.getElementById(sectionId)
  if (!el) return false
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  return true
}

function highlightSection(sectionId) {
  const el = document.getElementById(sectionId)
  if (!el) return false
  el.classList.add('highlight-section')
  setTimeout(() => el.classList.remove('highlight-section'), 2000)
  return true
}

function safeExternalUrl(url) {
  try {
    const u = new URL(url, window.location.href)
    return ['https:', 'http:', 'mailto:', 'tel:'].includes(u.protocol)
  } catch {
    return false
  }
}

function openExternal(url) {
  const ok = safeExternalUrl(url)
  if (!ok) return false
  window.open(url, '_blank', 'noopener,noreferrer')
  return true
}

/**
 * Executes an action object resolved by the assistant engine.
 * Supported shapes:
 *   { type: 'scroll', target }            -> scroll + highlight a section
 *   { type: 'highlight', target, item }   -> scroll section, highlight a card
 *   { type: 'open', target }              -> open a section (scroll)
 *   { type: 'contact', target, offer }    -> scroll to contact + optional links
 *   { type: 'openProject', target }       -> open project URL / scroll to work
 *   { type: 'openCaseStudy', target }     -> scroll to work section
 *   { type: 'focusContact', target }      -> scroll to contact
 *   { type: 'openLinkedIn' }              -> open LinkedIn in new tab
 *   { type: 'openEmail' }                 -> open email client
 * Returns true if any UI was triggered.
 */
export function executeAction(action) {
  if (!action) return false
  let handled = false

  switch (action.type) {
    case 'scroll':
    case 'open':
    case 'focusContact': {
      const id = action.target ? SECTION_IDS[action.target] || action.target : null
      if (id) {
        scrollToSection(id)
        highlightSection(id)
        handled = true
      }
      break
    }
    case 'highlight': {
      const id = action.target ? SECTION_IDS[action.target] || action.target : null
      if (id) {
        scrollToSection(id)
        highlightSection(id)
        if (action.item) {
          const itemEl = document.getElementById(action.item)
          if (itemEl) itemEl.classList.add('highlight-section')
        }
        handled = true
      }
      break
    }
    case 'openProject':
    case 'openCaseStudy': {
      const id = action.target ? SECTION_IDS[action.target] || action.target : 'work'
      scrollToSection(id)
      highlightSection(id)
      handled = true
      break
    }
    case 'contact': {
      const id = SECTION_IDS.contact
      scrollToSection(id)
      highlightSection(id)
      handled = true
      break
    }
    case 'openLinkedIn': {
      handled = openExternal(LINKEDIN)
      break
    }
    case 'openEmail': {
      handled = openExternal(`mailto:${EMAIL}`)
      break
    }
    default:
      handled = false
  }

  return handled
}

export const interactionContact = { EMAIL, PHONE, LINKEDIN, WHATSAPP }

export default { executeAction, SECTION_IDS, interactionContact }
