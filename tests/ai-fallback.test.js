import { describe, it, expect, vi, afterEach } from 'vitest'

import * as assistantEngine from '../src/services/assistant-engine.js'
import { getAIAnswer } from '../src/services/ai-service.js'

// AI fallback layer tests. No real network is ever used: global fetch is
// stubbed per test and restored afterwards. Each file runs in its own
// isolate, so these stubs never leak into other test files.

const realFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = realFetch
  vi.restoreAllMocks()
})

function okAI(content) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { content } }] }),
  }
}

function statusOnly(status) {
  return { ok: false, status, json: async () => ({}) }
}

describe('AI fallback — local-first routing', () => {
  it('makes zero AI requests for a strong local match', async () => {
    globalThis.fetch = vi.fn(async () => okAI('should never be used'))
    assistantEngine.resetRateLimit()
    const r = await assistantEngine.process('مين هي شيماء؟')
    expect(r.source).toBe('local')
    expect(r.answer).toMatch(/شيماء/)
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('unknown question succeeds via AI with source ai', async () => {
    globalThis.fetch = vi.fn(async () => okAI('عدد محافظات مصر حاليا 27 محافظة.'))
    assistantEngine.resetRateLimit()
    const r = await assistantEngine.process('عدد محافظات مصر كام؟')
    expect(r.source).toBe('ai')
    expect(r.answer).toContain('27')
    expect(r.followUps).toHaveLength(0)
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  it('sends laguna-s-2.1 to the same-origin proxy without any client key', async () => {
    globalThis.fetch = vi.fn(async () => okAI('ok'))
    const r = await getAIAnswer('Explain the difference between SEO and SEM', {})
    expect(r).not.toBeNull()
    const [url, opts] = globalThis.fetch.mock.calls[0]
    expect(url).toBe('/api/nara/v1/chat/completions')
    const body = JSON.parse(opts.body)
    expect(body.model).toBe('laguna-s-2.1')
    expect(Array.isArray(body.messages)).toBe(true)
    expect(body.messages[0].role).toBe('system')
    expect(body.messages[1].role).toBe('user')
    const headers = opts.headers || {}
    expect(JSON.stringify(headers)).not.toMatch(/bearer/i)
    expect(JSON.stringify(headers)).not.toMatch(/nara/i)
  })

  it('forwards small approved local context with the AI request', async () => {
    globalThis.fetch = vi.fn(async () => okAI('ok'))
    const r = await getAIAnswer('Does she do any banking work?', {
      localContext: [
        { intent: 'industries', topic: 'banking', content: 'No, Shymaa does not work in banking.' },
      ],
      memory: { lastIntent: 'industries', lastTopic: 'banking' },
    })
    expect(r).not.toBeNull()
    const [, opts] = globalThis.fetch.mock.calls[0]
    const body = JSON.parse(opts.body)
    const blob = JSON.stringify(body)
    // Closest approved knowledge (industries) travels with the request…
    expect(blob).toMatch(/industries/)
    expect(blob).toMatch(/banking/)
    // …but never the whole 5000-question knowledge base.
    expect(blob.length).toBeLessThan(4000)
  })

  it('empty AI content falls back to local', async () => {
    globalThis.fetch = vi.fn(async () => okAI('   '))
    assistantEngine.resetRateLimit()
    const r = await assistantEngine.process('إيه عاصمة اليابان؟')
    expect(r.source).toBe('fallback')
    expect(r.answer).toBeTruthy()
  })

  it('malformed AI JSON falls back to local', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token')
      },
    }))
    assistantEngine.resetRateLimit()
    const r = await assistantEngine.process('What is the speed of light?')
    expect(r.source).toBe('fallback')
    expect(r.answer).toBeTruthy()
  })

  it('network error falls back to local', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    })
    assistantEngine.resetRateLimit()
    const r = await assistantEngine.process('Explain quantum computing simply')
    expect(r.source).toBe('fallback')
    expect(r.answer).toBeTruthy()
  })

  it('timeout aborts and falls back to local', async () => {
    globalThis.fetch = vi.fn(
      (url, opts) =>
        new Promise((resolve, reject) => {
          opts?.signal?.addEventListener('abort', () =>
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))
          )
        })
    )
    const t0 = Date.now()
    const r = await getAIAnswer('Will this time out?', { timeoutMs: 60 })
    expect(Date.now() - t0).toBeLessThan(3000)
    expect(r).toBeNull()
  })

  it('HTTP 401 falls back to local', async () => {
    globalThis.fetch = vi.fn(async () => statusOnly(401))
    assistantEngine.resetRateLimit()
    const r = await assistantEngine.process('Tell me a fun fact about octopuses')
    expect(r.source).toBe('fallback')
    expect(r.answer).toBeTruthy()
  })

  it('HTTP 429 falls back to local', async () => {
    vi.resetModules()
    const fresh = await import('../src/services/assistant-engine.js')
    globalThis.fetch = vi.fn(async () => statusOnly(429))
    fresh.resetRateLimit()
    const r = await fresh.process('Tell me a fun fact about dolphins')
    expect(r.source).toBe('fallback')
    expect(r.answer).toBeTruthy()
  })

  it('HTTP 500 falls back to local', async () => {
    vi.resetModules()
    const fresh = await import('../src/services/assistant-engine.js')
    globalThis.fetch = vi.fn(async () => statusOnly(500))
    fresh.resetRateLimit()
    const r = await fresh.process('Tell me a fun fact about whales')
    expect(r.source).toBe('fallback')
    expect(r.answer).toBeTruthy()
  })
})
