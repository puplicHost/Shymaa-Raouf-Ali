import { describe, it, expect } from 'vitest'
import { searchLocal, findLocalAnswer } from '../src/services/local-knowledge-engine.js'

// Map of (query) -> expected { intentId, actionType, actionTarget }
const CASES = {
  // ---- Arabic ----
  'مين هي شيماء؟': { intentId: 'identity', actionType: 'scroll', actionTarget: 'about' },
  'عرفني بشيماء': { intentId: 'identity', actionType: 'scroll', actionTarget: 'about' },
  'وريني مشاريعها': { intentId: 'projects', actionType: 'scroll', actionTarget: 'work' },
  'إيه مهاراتها؟': { intentId: 'skills', actionType: 'scroll', actionTarget: 'skills' },
  'اشتغلت مع مين؟': { intentId: 'industries', actionType: 'scroll', actionTarget: 'work' },
  'إيه نوع المحتوى اللي بتعمله؟': { intentId: 'contentTypes', actionType: 'scroll', actionTarget: 'skills' },
  'إيه اللي بيميزها؟': { intentId: 'differentiator', actionType: 'scroll', actionTarget: 'about' },
  'إزاي بتشتغل؟': { intentId: 'approach', actionType: 'scroll', actionTarget: 'approach' },
  'عايز أتواصل معاها': { intentId: 'contact', actionType: 'contact', actionTarget: 'contact' },

  // ---- English ----
  'Who is Shymaa?': { intentId: 'identity', actionType: 'scroll', actionTarget: 'about' },
  'Show me her projects': { intentId: 'projects', actionType: 'scroll', actionTarget: 'work' },
  'What are her skills?': { intentId: 'skills', actionType: 'scroll', actionTarget: 'skills' },
  'Which industries has she worked with?': { intentId: 'industries', actionType: 'scroll', actionTarget: 'work' },
  'What makes her different?': { intentId: 'differentiator', actionType: 'scroll', actionTarget: 'about' },
  'How does she approach social media?': { intentId: 'approach', actionType: 'scroll', actionTarget: 'approach' },
  'I want to contact her': { intentId: 'contact', actionType: 'contact', actionTarget: 'contact' },
}

describe('LocalKnowledgeEngine — Arabic', () => {
  const arabicCases = Object.entries(CASES).filter(([q]) => /[\u0600-\u06FF]/.test(q))
  it.each(arabicCases)('%s -> %s', (query, expected) => {
    const result = searchLocal(query)
    expect(result.found).toBe(true)
    expect(result.source).toBe(expected.intentId)
    const answer = findLocalAnswer(query)
    expect(answer).not.toBeNull()
    expect(answer.intentId).toBe(expected.intentId)
    expect(answer.answer).toBeTruthy()
    expect(answer.action).not.toBeNull()
    expect(answer.action.type).toBe(expected.actionType)
    expect(answer.action.target).toBe(expected.actionTarget)
    // Use the client-approved wording.
    if (answer.lang === 'ar') {
      expect(answer.answer).toMatch(/شيماء/)
    } else {
      expect(answer.answer).toMatch(/Shymaa/i)
    }
  })
})

describe('LocalKnowledgeEngine — English', () => {
  const englishCases = Object.entries(CASES).filter(([q]) => !/[\u0600-\u06FF]/.test(q))
  it.each(englishCases)('%s -> %s', (query, expected) => {
    const result = searchLocal(query)
    expect(result.found).toBe(true)
    expect(result.source).toBe(expected.intentId)
    const answer = findLocalAnswer(query)
    expect(answer).not.toBeNull()
    expect(answer.intentId).toBe(expected.intentId)
    expect(answer.answer).toBeTruthy()
    expect(answer.action).not.toBeNull()
    expect(answer.action.type).toBe(expected.actionType)
    expect(answer.action.target).toBe(expected.actionTarget)
  })
})

describe('LocalKnowledgeEngine — no fabricated facts', () => {
  it('answers only approved content (identity)', () => {
    const a = findLocalAnswer('Who is Shymaa?')
    expect(a.answer).toContain('Social Media Specialist')
    expect(a.answer).toContain('Content Creator')
    // Must NOT invent job history that is not in the approved knowledge base.
    expect(a.answer).not.toMatch(/Tamiyouz/i)
    expect(a.answer).not.toMatch(/years of experience/i)
  })

  it('does not invent results or metrics', () => {
    const a = findLocalAnswer('Show me her projects')
    expect(a.answer).toContain('furniture, marble, pharmacies')
    expect(a.answer).not.toMatch(/results:/i)
    expect(a.answer).not.toMatch(/engagement rate/i)
  })
})

describe('LocalKnowledgeEngine — normalization', () => {
  it('handles alef variants: إزاي vs ازاي forms both match approach', () => {
    const r1 = searchLocal('إزاي بتشتغل؟')
    const r2 = searchLocal('ازاي شيماء بتشتغل؟')
    expect(r1.found).toBe(true)
    expect(r1.source).toBe('approach')
    expect(r2.found).toBe(true)
    expect(r2.source).toBe('approach')
  })

  it('handles Arabic "مين" vs "من" for identity', () => {
    const r = searchLocal('من هي شيماء؟')
    expect(r.found).toBe(true)
    expect(r.source).toBe('identity')
  })

  it('is deterministic given identical input', () => {
    const a = searchLocal('وريني مشاريعها')
    const b = searchLocal('وريني مشاريعها')
    expect(a.source).toBe(b.source)
    expect(a.score).toBe(b.score)
  })
})