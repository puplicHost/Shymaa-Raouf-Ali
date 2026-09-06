import { describe, it, expect } from 'vitest'
import knowledgeBase from '../src/data/knowledge-base.json'

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF]/g, ' ')
    .replace(/[ً-ٚـ]/g, '')
    .replace(/[آأإ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim()
}

describe('KB integrity — no cross-intent duplicates', () => {
  it('has zero normalized duplicate questions across intents', () => {
    const owners = new Map()
    const dupes = []
    for (const intent of knowledgeBase.intents) {
      for (const [lang, qs] of Object.entries(intent.questions || {})) {
        for (const q of qs) {
          const key = `${lang}::${norm(q)}`
          if (!key.split('::')[1]) continue
          if (!owners.has(key)) owners.set(key, new Set())
          owners.get(key).add(intent.id)
        }
      }
    }
    for (const [key, ids] of owners) {
      if (ids.size > 1) dupes.push(`${key} -> ${[...ids].join(',')}`)
    }
    expect(dupes).toEqual([])
  })

  it('meta.totalQuestions matches the actual count', () => {
    const total = knowledgeBase.intents.reduce(
      (n, i) => n + Object.values(i.questions || {}).reduce((a, qs) => a + qs.length, 0),
      0
    )
    expect(knowledgeBase.meta.totalQuestions).toBe(total)
  })

  it('every followUpPool key maps to an existing intent (no orphans)', () => {
    const ids = new Set(knowledgeBase.intents.map((i) => i.id))
    for (const key of Object.keys(knowledgeBase.followUpPool || {})) {
      expect(ids.has(key)).toBe(true)
    }
    for (const intent of knowledgeBase.intents) {
      expect(knowledgeBase.followUpPool[intent.id]).toBeDefined()
    }
  })

  it('banking negation leads every industries variation', () => {
    const ind = knowledgeBase.intents.find((i) => i.id === 'industries')
    for (const a of ind.answers.ar) {
      expect(a.startsWith('لا،') || a.startsWith('نحيطكم')).toBe(true)
    }
    for (const a of ind.answers.en) {
      expect(/^(No,|Nope|Please note)/.test(a)).toBe(true)
    }
  })
})
