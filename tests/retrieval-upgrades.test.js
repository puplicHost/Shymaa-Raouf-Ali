import { describe, it, expect } from 'vitest'
import { searchLocal } from '../src/services/local-knowledge-engine.js'
import { stripDefiniteArticle, tokensEquivalent, tokenize } from '../src/services/text-utils.js'
import * as engine from '../src/services/assistant-engine.js'

describe('retrieval upgrades — normalization', () => {
  it.each([
    ['بنك', 'البنك'],
    ['بنوك', 'البنوك'],
    ['أثاث', 'الأثاث'],
    ['رخام', 'الرخام'],
  ])('article equivalence: %s == %s', (a, b) => {
    expect(tokensEquivalent(a, b)).toBe(true)
  })

  it('guards radical-ال words', () => {
    expect(stripDefiniteArticle('الله')).toBe('الله')
    expect(stripDefiniteArticle('التي')).toBe('التي')
    expect(stripDefiniteArticle('الذي')).toBe('الذي')
    expect(stripDefiniteArticle('البنوك')).toBe('بنوك')
    expect(stripDefiniteArticle('الأثاث')).toBe('أثاث')
  })

  it('tokenizer never emits trailing punctuation', () => {
    for (const t of tokenize('ده؟ المشروع؟ مين شيماء!!')) {
      expect(t).not.toMatch(/[؟?!.,،;:]$/u)
    }
    expect(tokenize('البنوك؟')).toEqual(['البنوك'])
  })

  it.each([
    ['مين شيماء؟', 'مين شيماء', 'مين شيماء!!'],
  ])('punctuation variants resolve identically: %s', (...forms) => {
    const intents = forms.map((q) => searchLocal(q).source)
    expect(new Set(intents).size).toBe(1)
    expect(intents[0]).toBe('identity')
  })

  it('bare nouns route to industries', () => {
    expect(searchLocal('البنوك؟').source).toBe('industries')
    expect(searchLocal('الأثاث؟').source).toBe('industries')
  })
})

describe('retrieval upgrades — regression examples', () => {
  const cases = [
    ['مين هي شيماء؟', 'identity'],
    ['عايزة أعرف مهارات شيماء', 'skills'],
    ['وريني مشاريع الأثاث', 'projects'],
    ['شنو تشتغل شيماء؟', 'identity'],
    ['How does she approach social media?', 'approach'],
    ['شيماء تشتغل في البنوك؟', 'industries'],
    ['عايز أتواصل معاها', 'contact'],
    ['Does Shymaa hold a Google certificate?', 'certifications'],
    ['شيماء متاحة لشغل جديد؟', 'availability'],
    ['إيه اللي بيميزها عن غيرها؟', 'differentiator'],
    ['بتعمل ريلز؟', 'contentTypes'],
    ['خبرة شيماء في السوق السعودي؟', 'experience'],
    ['وين رقم شيماء؟', 'contact'],
  ]
  it.each(cases)('%s -> %s', async (q, expected) => {
    engine.resetRateLimit()
    const r = await engine.process(q)
    expect(r.intentId).toBe(expected)
    expect(r.answer).toBeTruthy()
  })

  it('small talk, unknown and navigation keep their sources', async () => {
    engine.resetRateLimit()
    expect((await engine.process('شكرا')).source).toBe('conversation')
    engine.resetRateLimit()
    expect((await engine.process('good')).source).toBe('fallback')
    engine.resetRateLimit()
    const nav = await engine.process('روح للتعريف')
    expect(nav.source).toBe('navigation')
    expect(nav.action).toMatchObject({ type: 'scroll', target: 'about' })
  })
})

describe('retrieval upgrades — conversation context', () => {
  it('pronoun follow-up inherits furniture projects context', async () => {
    engine.resetRateLimit()
    const first = await engine.process('وريني مشاريع الأثاث')
    expect(first.intentId).toBe('projects')
    expect(engine.getConversationState().lastTopic).toBe('furniture')
    await new Promise((r) => setTimeout(r, 1300))
    const second = await engine.process('طب ده؟')
    expect(second.source).toBe('local')
    expect(second.intentId).toBe('projects')
  }, 30000)

  it('explicit banking content beats furniture context', async () => {
    engine.resetRateLimit()
    await engine.process('وريني مشاريع الأثاث')
    await new Promise((r) => setTimeout(r, 1300))
    const r = await engine.process('طب في البنوك؟')
    expect(r.intentId).toBe('industries')
    expect(r.answer).toMatch(/بنوك|البنوك/)
  }, 30000)

  it('context expires and state resets cleanly', async () => {
    engine.resetRateLimit()
    await engine.process('وريني مشاريع الأثاث')
    const st = engine.getConversationState()
    expect(st.lastIntent).toBe('projects')
    expect(st.lastTopic).toBe('furniture')
    expect(st.recentTopics).toContain('furniture')
    engine.resetRateLimit()
    expect(engine.getConversationState().lastTopic).toBeNull()
    expect(engine.resolveContextFollowUp('طب ده؟')).toBeNull()
  }, 30000)
})
