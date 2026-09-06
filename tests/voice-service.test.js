import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import {
  createVoiceService,
  prepareTextForSpeech,
  pickVoice,
  VState,
} from '../src/services/voice-service.js'
import * as assistantEngine from '../src/services/assistant-engine.js'

// ---- Browser speech API mocks (file-local, fully restored) ----
const realSR = globalThis.window.SpeechRecognition
const realWebkitSR = globalThis.window.webkitSpeechRecognition
const realSynth = globalThis.window.speechSynthesis
const realUtterance = globalThis.SpeechSynthesisUtterance

class MockRecognition {
  static instances = []
  constructor() {
    MockRecognition.instances.push(this)
    this.startCalls = 0
    this.stopCalls = 0
    this.lang = ''
    this.onresult = null
    this.onend = null
    this.onerror = null
  }
  start() {
    this.startCalls += 1
  }
  stop() {
    this.stopCalls += 1
  }
}

class MockUtterance {
  static last = null
  constructor(text) {
    this.text = text
    this.lang = ''
    this.rate = 1
    this.pitch = 1
    this.volume = 1
    this.voice = null
    this.onend = null
    this.onerror = null
    MockUtterance.last = this
  }
}

let spoken = []
let cancelCalls = 0
let mockVoices = []

function installMocks(voices = []) {
  mockVoices = voices
  spoken = []
  cancelCalls = 0
  MockRecognition.instances = []
  MockUtterance.last = null
  globalThis.window.SpeechRecognition = MockRecognition
  globalThis.window.speechSynthesis = {
    speak: (u) => {
      spoken.push(u)
    },
    cancel: () => {
      cancelCalls += 1
    },
    getVoices: () => mockVoices,
  }
  globalThis.SpeechSynthesisUtterance = MockUtterance
}

function uninstallMocks() {
  globalThis.window.SpeechRecognition = realSR
  globalThis.window.webkitSpeechRecognition = realWebkitSR
  globalThis.window.speechSynthesis = realSynth
  globalThis.SpeechSynthesisUtterance = realUtterance
}

function finalResultEvent(text) {
  return {
    resultIndex: 0,
    results: [{ isFinal: true, 0: { transcript: text }, length: 1 }],
  }
}

function makeService(extra = {}) {
  const seen = { transcripts: [], states: [] }
  const svc = createVoiceService({
    onTranscript: (t) => seen.transcripts.push(t),
    onStateChange: (s) => seen.states.push(s),
    ...extra,
  })
  return { svc, seen }
}

beforeEach(() => {
  installMocks()
})

afterEach(() => {
  uninstallMocks()
  vi.useRealTimers()
})

describe('prepareTextForSpeech', () => {
  it('removes emojis but keeps Arabic meaning', () => {
    expect(prepareTextForSpeech('أكيد 😊 شيماء عندها خبرة في كتابة المحتوى! 📱✨')).toBe(
      'أكيد شيماء عندها خبرة في كتابة المحتوى!'
    )
  })

  it('strips markdown fences, bold, headers and links', () => {
    expect(prepareTextForSpeech('```code``` **مهم** ## عنوان [نص](http://x)')).toContain('مهم')
    expect(prepareTextForSpeech('```code``` **مهم**')).not.toMatch(/[*`#]/)
  })

  it('drops raw URLs but keeps emails', () => {
    const out = prepareTextForSpeech('تواصل https://example.com/x أو raoufshimaa587@gmail.com')
    expect(out).not.toContain('https://')
    expect(out).toContain('raoufshimaa587@gmail.com')
  })

  it('returns empty for emoji-only input', () => {
    expect(prepareTextForSpeech('😊📱✨')).toBe('')
  })
})

describe('pickVoice', () => {
  const AR_EG = { lang: 'ar-EG', name: 'Arabic Egypt' }
  const AR_SA = { lang: 'ar-SA', name: 'Arabic Saudi' }
  const EN = { lang: 'en-US', name: 'English US' }

  it('prefers ar-EG, then ar-SA, then any Arabic voice', () => {
    installMocks([EN, AR_SA, AR_EG])
    expect(pickVoice('ar-EG')).toBe(AR_EG)
    installMocks([EN, AR_SA])
    expect(pickVoice('ar-EG')).toBe(AR_SA)
    installMocks([EN])
    expect(pickVoice('ar-EG')).toBe(EN)
  })

  it('returns null when no voices exist', () => {
    installMocks([])
    expect(pickVoice('ar-EG')).toBeNull()
  })
})

describe('voice session state machine', () => {
  it('is a safe no-op without browser APIs', () => {
    uninstallMocks()
    const { svc } = makeService()
    expect(svc.available).toBe(false)
    expect(svc.listen()).toBe(false)
    expect(svc.state).toBe(VState.IDLE)
    expect(svc.speak('hello')).toBe(false)
  })

  it('startSession -> listening; single recognition instance', () => {
    const { svc, seen } = makeService()
    expect(svc.startSession()).toBe(true)
    expect(svc.state).toBe(VState.LISTENING)
    expect(svc.listening).toBe(true)
    svc.startSession()
    expect(MockRecognition.instances).toHaveLength(1)
    expect(seen.states).toContain(VState.LISTENING)
  })

  it('final transcript triggers onTranscript once (dedupe)', () => {
    const { svc, seen } = makeService()
    svc.startSession()
    const rec = MockRecognition.instances[0]
    rec.onresult(finalResultEvent('مين شيماء؟'))
    rec.onresult(finalResultEvent('مين شيماء؟'))
    expect(seen.transcripts).toEqual(['مين شيماء؟'])
    expect(svc.state).toBe(VState.PROCESSING)
  })

  it('speak() reads a sanitized copy and resumes listening after TTS', () => {
    const { svc, seen } = makeService()
    svc.startSession()
    const rec = MockRecognition.instances[0]
    rec.onresult(finalResultEvent('مين شيماء؟'))
    expect(svc.speak('أكيد 😊 شيماء 📱')).toBe(true)
    expect(MockUtterance.last.text).toBe('أكيد شيماء')
    expect(svc.state).toBe(VState.RESPONDING)
    expect(svc.speaking).toBe(true)
    MockUtterance.last.onend()
    expect(svc.speaking).toBe(false)
    expect(svc.state).toBe(VState.LISTENING)
    expect(seen.states).toContain(VState.RESPONDING)
  })

  it('interrupt() cancels TTS and resumes the live session', () => {
    const { svc } = makeService()
    svc.startSession()
    svc.speak('hello world test message')
    expect(svc.interrupt()).toBe(true)
    expect(cancelCalls).toBeGreaterThan(0)
    expect(svc.state).toBe(VState.LISTENING)
  })

  it('endSession stops everything and onend cannot resurrect it', () => {
    const { svc, seen } = makeService()
    svc.startSession()
    const rec = MockRecognition.instances[0]
    svc.endSession()
    expect(svc.state).toBe(VState.STOPPED)
    expect(svc.session).toBe(false)
    const statesAfterStop = seen.states.length
    rec.onend()
    expect(svc.state).toBe(VState.STOPPED)
    expect(seen.states).toHaveLength(statesAfterStop)
  })

  it('fatal mic errors end the session; transient errors recover', () => {
    const { svc } = makeService()
    svc.startSession()
    const rec = MockRecognition.instances[0]
    rec.onerror({ error: 'not-allowed' })
    expect(svc.state).toBe(VState.STOPPED)
    expect(svc.session).toBe(false)

    const second = makeService()
    second.svc.startSession()
    const rec2 = MockRecognition.instances[MockRecognition.instances.length - 1]
    rec2.onerror({ error: 'network' })
    expect(second.svc.state).toBe(VState.LISTENING)
  })

  it('silence finalizes interim speech (fake timers)', () => {
    vi.useFakeTimers()
    const { svc, seen } = makeService()
    svc.startSession()
    const rec = MockRecognition.instances[0]
    rec.onresult({ resultIndex: 0, results: [{ isFinal: false, 0: { transcript: 'مهارات' }, length: 1 }] })
    expect(seen.transcripts).toHaveLength(0)
    vi.advanceTimersByTime(2600)
    expect(seen.transcripts).toEqual(['مهارات'])
  })
})

describe('local core independence (AI kill-switch observable behavior)', () => {
  it('local answers, context, follow-ups and actions work with AI failing', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    })
    assistantEngine.resetRateLimit()
    const identity = await assistantEngine.process('مين هي شيماء؟')
    expect(identity.source).toBe('local')
    expect(identity.followUps).toHaveLength(2)

    assistantEngine.resetRateLimit()
    const skills = await assistantEngine.process('إيه مهاراتها؟')
    expect(skills.source).toBe('local')
    expect(skills.action).toMatchObject({ target: 'skills' })

    assistantEngine.resetRateLimit()
    const nav = await assistantEngine.process('روح للتعريف')
    expect(nav.source).toBe('navigation')
    expect(nav.action).toMatchObject({ target: 'about' })
  })
})
