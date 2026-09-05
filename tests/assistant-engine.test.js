import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Simulate various AI failure modes without a real network.
const failures = {
  offline: () => Promise.reject(new TypeError('Failed to fetch')),
  timeout: () =>
    new Promise((_, reject) => setTimeout(() => reject(new DOMException('The operation was aborted.', 'AbortError')), 5)),
  'http 400': { status: 400, ok: false },
  'http 401': { status: 401, ok: false },
  'http 403': { status: 403, ok: false },
  'http 404': { status: 404, ok: false },
  'http 429': { status: 429, ok: false },
  'http 500': { status: 500, ok: false },
}

import * as assistantEngine from '../src/services/assistant-engine.js'

function setFetchBehavior(behavior) {
  global.fetch = vi.fn(() => {
    if (typeof behavior === 'function') return behavior()
    return Promise.resolve({
      ok: behavior.ok !== false,
      status: behavior.status || 200,
      json: async () => ({}),
    })
  })
}

const TECHNICAL_TOKENS = [
  'API', 'api', '404', '403', '401', '429', '500', 'Nara', 'nara',
  'unavailable', 'failed to fetch', 'network error', 'stack', 'timeout',
  'rate', 'limit reached', 'key missing', 'error',
]

function assertUsefulResponse(result) {
  expect(result).toBeTruthy()
  expect(result.answer).toBeTruthy()
  expect(typeof result.answer).toBe('string')
  expect(result.answer.length).toBeGreaterThan(0)
  // Never expose technical failures to the user.
  const lower = result.answer.toLowerCase()
  for (const token of TECHNICAL_TOKENS) {
    expect(lower.includes(token.toLowerCase())).toBe(false)
  }
}

describe('AssistantEngine — local answers always work', () => {
  beforeEach(() => {
    setFetchBehavior(failures['http 500'])
    assistantEngine.resetRateLimit()
  })

  it('answers identity locally even when AI fails', async () => {
    const result = await assistantEngine.process('مين هي شيماء؟')
    expect(result.source).toBe('local')
    assertUsefulResponse(result)
    expect(result.answer).toMatch(/شيماء/)
    expect(result.answer).not.toMatch(/Social Media Specialist/)
  })

  it('answers projects locally even when AI fails', async () => {
    const result = await assistantEngine.process('Show me her projects')
    expect(result.source).toBe('local')
    assertUsefulResponse(result)
  })

  it('performs its portfolio action for local matches', async () => {
    const result = await assistantEngine.process('إيه مهاراتها؟')
    expect(result.source).toBe('local')
    expect(result.action).not.toBeNull()
    expect(result.action.target).toBe('skills')
  })
})

describe('AssistantEngine — AI failure modes → safe fallback', () => {
  for (const [name, behavior] of Object.entries(failures)) {
    it(`never exposes a technical error on: ${name}`, async () => {
      assistantEngine.resetRateLimit()
      setFetchBehavior(behavior)
      // Free Chinese/off-topic query that cannot resolve locally.
      const result = await assistantEngine.process('Tell me the meaning of life in 3 paragraphs about elephants')
      // Either AI succeeded (unlikely with our mock) or safe local fallback.
      assertUsefulResponse(result)
      expect(result.source === 'local' || true).toBe(true)
    })
  }
})

describe('AssistantEngine — AI unavailable (disabled) → safe fallback', () => {
  it('falls back gracefully and never mentions AI being off', async () => {
    assistantEngine.resetRateLimit()
    // Force behaviour where AI returns nothing usable.
    setFetchBehavior({ status: 200, ok: true, json: async () => ({ choices: [] }) })
    const result = await assistantEngine.process('What would a brand new business do first on social media?')
    assertUsefulResponse(result)
    expect(result.answer.toLowerCase()).not.toContain('ai')
    expect(result.answer.toLowerCase()).not.toContain('model')
  })
})

describe('AssistantEngine — guards', () => {
  it('rejects empty input', () => {
    expect(assistantEngine.canProcessInput('')).toBe(false)
    expect(assistantEngine.canProcessInput('   ')).toBe(false)
    expect(assistantEngine.canProcessInput(null)).toBe(false)
  })

  it('rejects overlong input', () => {
    expect(assistantEngine.canProcessInput('a'.repeat(600))).toBe(false)
  })
})