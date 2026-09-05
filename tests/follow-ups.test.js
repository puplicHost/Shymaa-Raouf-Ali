import { describe, it, expect } from 'vitest'
import knowledgeBase from '../src/data/knowledge-base.json'
import * as assistantEngine from '../src/services/assistant-engine.js'

const intents = knowledgeBase.intents
const knownIds = intents.map((i) => i.id)

describe('Follow-up suggestions — knowledge base structure', () => {
  it('every intent defines exactly 2 follow-ups, targets only existing intents', () => {
    for (const intent of intents) {
      expect(Array.isArray(intent.followUps)).toBe(true)
      expect(intent.followUps).toHaveLength(2)
      const targets = intent.followUps.map((f) => f.intent)
      expect(new Set(targets).size).toBe(2) // no duplicated target within an intent
      for (const f of intent.followUps) {
        expect(knownIds).toContain(f.intent)
        expect(f.intent).not.toBe(intent.id) // never suggests the current intent (no self-loop)
        expect(f.label).toBeDefined()
        expect(f.label.ar.trim()).not.toBe('')
        expect(f.label.en.trim()).not.toBe('')
      }
    }
  })
})

// Builds [fromIntent, toIntent, label, lang] tuples for every follow-up in
// both languages — mirroring what happens when the user clicks the button.
const CLICK_CASES = intents.flatMap((intent) =>
  intent.followUps.flatMap((f) => [
    [intent.id, f.intent, f.label.ar, 'ar'],
    [intent.id, f.intent, f.label.en, 'en'],
  ])
)

describe('Follow-up click behaves exactly like typing the question', () => {
  it.each(CLICK_CASES)(
    '%s -> %s (%s) via %j',
    async (fromIntent, toIntent, label, lang) => {
      assistantEngine.resetRateLimit()
      const r = await assistantEngine.process(label)
      expect(r.source).toBe('local') // must resolve locally, never AI
      expect(r.intentId).toBe(toIntent)
      expect(r.lang).toBe(lang)
      expect(r.answer).toBeTruthy()
      expect(r.followUps).toHaveLength(2) // the new answer brings its own 2 follow-ups
    }
  )
})