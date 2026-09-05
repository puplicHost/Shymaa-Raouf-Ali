import { describe, it, expect, beforeEach } from 'vitest'

import * as assistantEngine from '../src/services/assistant-engine.js'
import { searchLocal, findLocalAnswer } from '../src/services/local-knowledge-engine.js'
import knowledgeBase from '../src/data/knowledge-base.json'

const ARABIC_INPUTS = (query) => /[\u0600-\u06FF]/.test(query)

describe('Smart normalization — short inputs resolve to closest intent', () => {
  const EN_CASES = [
    ['learn', 'education'],
    ['learning', 'education'],
    ['study', 'education'],
    ['work', 'projects'],
    ['portfolio', 'projects'],
    ['project', 'projects'],
    ['skill', 'skills'],
    ['skills', 'skills'],
    ['number', 'contact'],
    ['info', 'contact'],
    ['contact info', 'contact'],
    ['email', 'contact'],
    ['phone', 'contact'],
  ]

  // A couple of Arabic spellings vary (hamza/teh-marbuta); check the target intent.
  const AR_CASES = [
    ['تعلم', 'education'],
    ['تعليم', 'education'],
    ['دراسة', 'education'],
    ['مهارة', 'skills'],
    ['مهارات', 'skills'],
    ['رقم', 'contact'],
    ['تواصل', 'contact'],
    ['معلومات التواصل', 'contact'],
    ['مشاريع', 'projects'],
    ['أعمال', 'projects'],
    ['شغل', 'projects'],
  ]

  it.each(EN_CASES)('%s -> %s', (query, intentId) => {
    const r = searchLocal(query)
    expect(r.found).toBe(true)
    expect(r.source).toBe(intentId)
    const a = findLocalAnswer(query)
    expect(a.intentId).toBe(intentId)
  })

  it.each(AR_CASES)(`%s -> %s`, (query, intentId) => {
    if (!ARABIC_INPUTS(query)) return
    const r = searchLocal(query)
    expect(r.found).toBe(true)
    expect(r.source).toBe(intentId)
    const a = findLocalAnswer(query)
    expect(a.intentId).toBe(intentId)
  })
})

describe('Smart normalization — ambiguous inputs stay unresolved', () => {
  const AMBIGUOUS = ['hello', 'good', 'okay', 'test', 'asdf', 'random', 'nice']

  it.each(AMBIGUOUS)('%s is NOT forced into an unrelated intent', (query) => {
    const r = searchLocal(query)
    expect(r.found).toBe(false)
    // The assistant must fall back (local engine not confident), not guess.
    expect(r.source).toBeNull()
  })
})

describe('Follow-up diversity — exactly 2, no self-loop, valid, diverse', () => {
  beforeEach(() => {
    assistantEngine.resetRateLimit()
  })

  const knownIds = knowledgeBase.intents.map((i) => i.id)

  it('returns exactly 2 follow-ups for every resolved intent in both languages', async () => {
    for (const q of ['مين هي شيماء؟', 'وريني مشاريعها', 'إيه مهاراتها؟', 'تعلم', 'رقم']) {
      assistantEngine.resetRateLimit()
      const r = await assistantEngine.process(q)
      expect(r.followUps).toHaveLength(2)
      for (const f of r.followUps) {
        expect(knownIds).toContain(f.intent)
        expect(f.intent).not.toBe(r.intentId) // no self-loop
        expect(f.label.trim()).not.toBe('')
        expect(f.label.ar ? f.label.ar.trim() : f.label.trim()).not.toBe('')
        expect(f.label.en ? f.label.en.trim() : f.label.trim()).not.toBe('')
      }
      // Two suggestions must not lead to the same destination.
      expect(new Set(r.followUps.map((f) => f.intent)).size).toBe(2)
    }
  })

  it('keeps the canonical pair when there is no prior context', async () => {
    assistantEngine.resetRateLimit()
    const r = await assistantEngine.process('مين هي شيماء؟')
    expect(r.followUps.map((f) => f.intent)).toEqual(['projects', 'differentiator'])
    expect(r.followUps[0].label).toBe('🎨 وريني مشاريعها')
    expect(r.followUps[1].label).toBe('💡 إيه اللي بيميزها؟')
  })

  it('does not repeat a just-answered intent as a follow-up', async () => {
    assistantEngine.resetRateLimit()
    // Answer identity first.
    const first = await assistantEngine.process('مين هي شيماء؟') // recent = [identity]
    // Click one of its follow-ups ("projects") -> recent = [identity, projects]
    assistantEngine.resetRateLimit()
    const second = await assistantEngine.process(first.followUps[0].label)
    expect(second.intentId).toBe('projects')
    expect(second.followUps).toHaveLength(2)
    // The follow-ups for "projects" must not re-offer "projects" nor identity.
    expect(second.followUps.map((f) => f.intent)).not.toContain('projects')
    expect(second.followUps.map((f) => f.intent)).not.toContain('identity')
    // And the two suggestions should point at different topics.
    expect(new Set(second.followUps.map((f) => f.intent)).size).toBe(2)
  })

  it('prefers two different topics over two same-topic suggestions', () => {
    // projects is in the work category; a diverse replacement should be a
    // non-work topic (e.g. skills/differentiator) rather than work again.
    const picked = assistantEngine.pickFollowUps('projects', 'en', ['identity', 'projects'])
    expect(picked).toHaveLength(2)
    const cats = picked.map((f) => {
      const target = knowledgeBase.intents.find((i) => i.id === f.intent)
      return target ? target.category : null
    })
    // At least one of the two should differ from the work category.
    expect(cats.some((c) => c !== 'work')).toBe(true)
  })

  it('keeps the picker deterministic given identical history', () => {
    const a = assistantEngine.pickFollowUps('projects', 'ar', ['identity', 'projects'])
    const b = assistantEngine.pickFollowUps('projects', 'ar', ['identity', 'projects'])
    expect(a).toEqual(b)
  })
})

describe('Follow-up click behaves exactly like typing the label', () => {
  beforeEach(() => {
    assistantEngine.resetRateLimit()
  })

  it('a clicked substitute label resolves locally with fresh follow-ups', async () => {
    assistantEngine.resetRateLimit()
    const first = await assistantEngine.process('مين هي شيماء؟')
    const label = first.followUps[0].label
    assistantEngine.resetRateLimit()
    const r = await assistantEngine.process(label)
    expect(r.source).toBe('local') // must resolve locally, never AI
    expect(r.intentId).toBe('projects')
    expect(r.answer).toBeTruthy()
    expect(r.followUps).toHaveLength(2)
  })
})

// Re-check that the new/education intent is fully wired through the KB.
describe('Knowledge base — education intent + aliases', () => {
  it('defines an education intent with bilingual alias data', () => {
    const edu = knowledgeBase.intents.find((i) => i.id === 'education')
    expect(edu).toBeDefined()
    expect(edu.aliases).toBeDefined()
    expect(edu.aliases.en).toContain('learn')
    expect(edu.aliases.ar).toContain('تعلم')
    expect(edu.answer).toBeDefined()
    expect(edu.answer.en.trim()).not.toBe('')
    expect(edu.answer.ar.trim()).not.toBe('')
  })

  it('includes every intent in the follow-up pool source', () => {
    for (const intent of knowledgeBase.intents) {
      expect(knowledgeBase.followUpPool[intent.id]).toBeDefined()
    }
  })
})