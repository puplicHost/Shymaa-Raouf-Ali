# Voice AI System — Technical Audit Report

**Auditor:** Senior Voice AI Architect & Code Auditor
**Date:** 2026-09-04
**Project:** Shymaa Raouf Ali — Portfolio Website
**Framework:** Vue.js 3 + Vite 8.2
**Primary File:** `src/components/AIAssistant.vue` (1209 lines)

---

## 1. Executive Summary

The current voice system is a **full voice chat mode** with continuous conversation capability. It supports speech-to-text (Web Speech API), automatic sending, automatic text-to-speech on responses, and a continuous listen-speak-listen loop. The system operates entirely client-side with no backend proxy.

**Classification:** Full voice chat with continuous conversation

**Maturity Score: 6.5 / 10**

**Three most important findings:**

1. **Gemini API key is exposed in the production JavaScript bundle** (`AIzaSy********`) — anyone can extract it from `dist/assets/index-*.js` and abuse the quota.
2. **No user interrupt capability** — while the assistant is speaking, the user cannot tap the mic to interrupt; they must wait or press "Stop speaking."
3. **Single shared `SpeechRecognition` instance** — the same `recognition` object is reused for both text-mode one-shot voice input and voice-mode continuous conversation, creating potential state conflicts.

---

## 2. Complete Voice Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    VOICE CHAT MODE FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User clicks mic toggle (header)                                │
│  └─ toggleVoiceMode()                                          │
│      └─ startVoiceMode()                                       │
│          ├─ isVoiceMode = true                                  │
│          ├─ autoListenEnabled = true                            │
│          └─ startListening()                                    │
│              └─ recognition.start() [SpeechRecognition API]    │
│                  └─ isListening = true                          │
│                      └─ updateVoiceStatus('listening')         │
│                                                                 │
│  User speaks ──► recognition.onresult                          │
│  └─ handleRecognitionResult(event)                             │
│      ├─ transcript = event.results[0][0].transcript            │
│      ├─ Dedup check (last message match)                       │
│      ├─ userInput = transcript                                  │
│      └─ autoSendVoice(transcript)                              │
│          ├─ isProcessing = true                                 │
│          ├─ messages.push({ role: 'user', text })              │
│          └─ getResponse(text)                                   │
│              ├─ getCachedResponse() ──► cache hit? return       │
│              ├─ searchKnowledgeBase() [similarity.js]           │
│              │   └─ TF-IDF cosine + keyword boost              │
│              │       ├─ score >= 0.5? return local answer       │
│              │       └─ score < 0.5? fall through               │
│              └─ callGeminiAPI() [generativelanguage API]        │
│                  ├─ SYSTEM_PROMPT (built from KB intents)       │
│                  ├─ conversationHistory (last 6 messages)       │
│                  └─ fetch(Gemini REST API)                      │
│                                                                 │
│  Response received                                              │
│  └─ messages.push({ role: 'assistant', text })                 │
│      └─ speakTextAuto(response)                                 │
│          ├─ speechSynthesis.cancel()                            │
│          ├─ Clean markdown/HTML                                 │
│          ├─ SpeechSynthesisUtterance(cleanText)                 │
│          ├─ utterance.lang = ar-EG or en-US                     │
│          ├─ isSpeaking = true                                   │
│          ├─ utterance.onend → isSpeaking = false                │
│          └─ speechSynthesis.speak(utterance)                    │
│                                                                 │
│  Speech ends                                                    │
│  └─ isSpeaking = false                                          │
│      └─ handleRecognitionEnd()                                  │
│          └─ setTimeout(startListening, 300)                     │
│              └─ [loop restarts]                                 │
│                                                                 │
│  User clicks "End voice chat"                                   │
│  └─ endVoiceChat()                                              │
│      ├─ autoListenEnabled = false                               │
│      ├─ stopListening()                                         │
│      ├─ stopSpeaking()                                          │
│      └─ all states reset to false                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step-by-step traceability

| Step | File | Function | Browser API | Line |
|------|------|----------|-------------|------|
| Mic toggle | AIAssistant.vue | `toggleVoiceMode()` | — | :535 |
| Start listening | AIAssistant.vue | `startListening()` | `SpeechRecognition.start()` | :551 |
| Speech result | AIAssistant.vue | `handleRecognitionResult()` | `SpeechRecognition.onresult` | :573 |
| Auto-send | AIAssistant.vue | `autoSendVoice()` | — | :599 |
| Local search | similarity.js | `searchKnowledgeBase()` | — | :171 |
| TF-IDF scoring | similarity.js | `findBestMatch()` | — | :128 |
| Gemini call | AIAssistant.vue | `callGeminiAPI()` | `fetch()` | :355 |
| Auto-speak | AIAssistant.vue | `speakTextAuto()` | `SpeechSynthesis.speak()` | :437 |
| Speech end | AIAssistant.vue | `handleRecognitionEnd()` | `SpeechRecognition.onend` | :592 |
| Restart listen | AIAssistant.vue | `startListening()` (via setTimeout) | — | :551 |

---

## 3. Speech-to-Text Analysis

### API Used
**Web Speech API** — `SpeechRecognition` / `webkitSpeechRecognition`

```javascript
// AIAssistant.vue :208-214
const speechSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

if (speechSupported) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  recognition = new SpeechRecognition()
  recognition.continuous = false
  recognition.interimResults = false
}
```

### Recognition Behavior

| Aspect | Value | Evidence |
|--------|-------|----------|
| API | `SpeechRecognition` / `webkitSpeechRecognition` | :208 |
| `continuous` | `false` | :212 |
| `interimResults` | `false` | :213 |
| Recording mode | Click-to-toggle (text mode) or auto-start (voice mode) | :252 (text), :547 (voice) |
| Duplicate prevention | Checks last message matches transcript | :581-586 |
| Auto-restart | Yes, via `handleRecognitionEnd` + `setTimeout(startListening, 300)` | :592-596 |
| Language codes | `ar-EG` (Arabic), `en-US` (English) | :261 |

### Language Detection

```javascript
// AIAssistant.vue :259-262
function getVoiceLang(text) {
  if (text) return detectLang(text) === 'ar' ? 'ar-EG' : 'en-US'
  return navigator.language.startsWith('ar') ? 'ar-EG' : 'en-US'
}
```

Detection is based on `navigator.language` (browser locale) before speech, and Arabic character ratio (>30%) after speech.

### Error Handling

| Error | Action | Line |
|-------|--------|------|
| `not-allowed` | Shows message, disables voice mode | :614-619 |
| `no-speech` | Auto-restarts after 800ms | :620-622 |
| Other errors | Auto-restarts after 1000ms (except `aborted`) | :623-625 |
| Start failure | Catches exception, sets `isListening = false` | :559 |

### Browser Support Detection

```javascript
const speechSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
```

If unsupported, `voiceApiSupported = false` and the voice toggle button is hidden (`v-if="voiceApiSupported"`).

### Duplicate Transcript Prevention

```javascript
// AIAssistant.vue :581-586
const lastMsg = messages.value[messages.value.length - 1]
if (lastMsg && lastMsg.role === 'user' && lastMsg.text === transcript) {
  if (autoListenEnabled) {
    setTimeout(() => startListening(), 500)
  }
  return
}
```

### Issues Found

1. **Single shared instance** — the same `recognition` object is used for text-mode `toggleVoice()` and voice-mode `startListening()`. If both paths are triggered, the instance could be in an inconsistent state.
2. **No confidence threshold** — even very low-confidence transcripts are accepted.
3. **`continuous: false`** — recognition stops after each utterance; the system relies on manual restart via `handleRecognitionEnd`.

---

## 4. Text-to-Speech Analysis

### API Used
**Web Speech API** — `SpeechSynthesis` / `SpeechSynthesisUtterance`

### Two TTS Functions

| Function | Mode | Auto-cleanup | Promise-based | Line |
|----------|------|-------------|---------------|------|
| `speakText()` | Manual (button click) | Yes (`cancel()` first) | No | :428 |
| `speakTextAuto()` | Auto (voice mode) | Yes (`cancel()` first) | Yes (Promise) | :437 |

### Language Selection

```javascript
// AIAssistant.vue :447
utterance.lang = /[\u0600-\u06FF]/.test(text) ? 'ar-EG' : 'en-US'
```

Arabic character detection via Unicode range `\u0600-\u06FF`.

### Text Cleaning

```javascript
const cleanText = text.replace(/<[^>]*>/g, '').replace(/\*\*/g, '').replace(/[#*_`~]/g, '')
```

Removes: HTML tags, bold markdown, hash/asterisk/underscore/backtick/tilde.

### Speech Completion Detection

```javascript
// AIAssistant.vue :455-458
utterance.onend = () => {
  isSpeaking.value = false
  resolve()
}
utterance.onerror = () => {
  isSpeaking.value = false
  resolve()
}
```

### Stop-Speaking Control

```javascript
// AIAssistant.vue :461-468
function stopSpeaking() {
  if (ttsSupported) window.speechSynthesis.cancel()
  isSpeaking.value = false
  if (isVoiceMode.value && autoListenEnabled) {
    updateVoiceStatus('idle')
    setTimeout(() => startListening(), 300)
  }
}
```

### Auto-listen After Speaking

Yes — `handleRecognitionEnd()` triggers `startListening()` after 300ms delay if `autoListenEnabled` is true.

### Voice Selection

No explicit voice selection — uses browser default for the selected language. No `speechSynthesis.getVoices()` call.

### Issues Found

1. **No voice preference** — browser default may not be optimal for Arabic.
2. **Safari quirks** — Safari may not fire `onend` reliably; no workaround present.
3. **`speechSynthesis` can freeze** — Chrome has a known bug where long utterances may hang; no watchdog timer.

---

## 5. Conversation Mode

| Capability | Status | Evidence |
|-----------|--------|----------|
| One-shot voice input | **Implemented** | `toggleVoice()` at :498 (text mode mic button) |
| Automatic send | **Implemented** | `autoSendVoice()` at :599 |
| Automatic spoken replies | **Implemented** | `speakTextAuto()` at :437 |
| Continuous conversation | **Implemented** | `handleRecognitionEnd()` → `startListening()` loop at :592 |
| Interrupting assistant | **Partially implemented** | `stopSpeaking()` exists but mic is **disabled** while speaking (`:disabled="isSpeaking"` on voice-mic) |
| Ending voice mode | **Implemented** | `endVoiceChat()` at :539 |
| Returning to text mode | **Implemented** | `endVoiceChat()` resets `isVoiceMode = false` |
| Preventing feedback loops | **Implemented** | `cancel()` before each speak; recognition stops during processing/speaking |

### Interrupt Limitation

```html
<!-- AIAssistant.vue :97 -->
<button
  class="voice-btn voice-mic"
  :class="{ listening: isListening, processing: isProcessing }"
  @click="toggleListening"
  :disabled="isProcessing || isSpeaking"
>
```

The mic button is **disabled** during speaking. The user cannot interrupt by speaking — they must press "Stop speaking" button first.

---

## 6. State Machine

### Reactive State Variables

| Variable | Type | Purpose |
|----------|------|---------|
| `isVoiceMode` | `ref(false)` | Voice panel visible |
| `isListening` | `ref(false)` | Speech recognition active |
| `isSpeaking` | `ref(false)` | TTS playing |
| `isProcessing` | `ref(false)` | Waiting for AI response |
| `isRecording` | `ref(false)` | Text-mode mic active |
| `isTyping` | `ref(false)` | Text-mode processing |
| `voiceStatus` | `ref('idle')` | Status label |
| `autoListenEnabled` | `let` (non-reactive) | Continuous loop flag |

### State Transitions

```
                  ┌──────────────────────────────────────┐
                  │                                      │
                  ▼                                      │
    ┌─────────────────────┐                             │
    │       IDLE          │◄────────────────────────────┤
    │  (voice-status:     │                             │
    │   "Tap mic to start")│                             │
    └─────────┬───────────┘                             │
              │ startListening()                        │
              ▼                                         │
    ┌─────────────────────┐                             │
    │     LISTENING       │                             │
    │  (pulsing red mic)  │                             │
    └─────────┬───────────┘                             │
              │ onresult                                │
              ▼                                         │
    ┌─────────────────────┐                             │
    │     PROCESSING      │                             │
    │  (yellow indicator) │                             │
    └─────────┬───────────┘                             │
              │ getResponse() → speakTextAuto()         │
              ▼                                         │
    ┌─────────────────────┐                             │
    │      SPEAKING       │                             │
    │  (green indicator)  │                             │
    └─────────┬───────────┘                             │
              │ onend → handleRecognitionEnd()          │
              │ setTimeout(startListening, 300)         │
              └─────────────────────────────────────────┘

    Any state ──endVoiceChat()──► IDLE (all flags reset)
    LISTENING ──onerror('not-allowed')──► IDLE (voice mode off)
    PROCESSING ──onerror──► IDLE
```

### Race Conditions

1. **`isProcessing` guard in `autoSendVoice()`** — `:600` checks `if (!text || isProcessing.value) return`, preventing duplicate sends during processing.
2. **`isListening` guard in `startListening()`** — `:553` checks `if (!recognition || isListening.value || isProcessing.value || isSpeaking.value) return`.
3. **Potential race:** `handleRecognitionEnd()` fires `setTimeout(startListening, 300)` while `autoSendVoice()` is still awaiting `getResponse()`. The `isProcessing` guard prevents actual start, but the timer is still scheduled.

### Unmount Cleanup

```javascript
// AIAssistant.vue :517-526
onBeforeUnmount(() => {
  autoListenEnabled = false
  if (recognition) {
    try { recognition.stop() } catch {}
    recognition.onresult = null
    recognition.onerror = null
    recognition.onend = null
    recognition = null
  }
  if (ttsSupported) {
    window.speechSynthesis.cancel()
  }
})
```

**Verdict:** Cleanup is thorough — event listeners removed, recognition stopped, synthesis cancelled.

---

## 7. AI and RAG Integration

### Voice Input → AI Layer

Voice transcript becomes identical to typed text:

```javascript
// AIAssistant.vue :598
userInput.value = transcript
autoSendVoice(transcript)  // same path as sendMessage()
```

### Search Architecture

| Component | Implementation | File |
|-----------|---------------|------|
| Keyword search | TF-IDF cosine similarity | `similarity.js:128` |
| Embeddings | **Not implemented** | — |
| BM25 | **Not implemented** | — |
| Vector database | **Not implemented** | — |
| RAG | **Not implemented** | — |
| Gemini call | Direct REST API | `AIAssistant.vue:355` |
| AI Agent | **Not implemented** | — |
| Tool calling | **Not implemented** | — |
| GitHub integration | **Not implemented** | — |
| Dynamic navigation | **Not implemented** | — |

### Knowledge Base Restriction

Gemini receives a `system_instruction` that says "Answer ONLY from the knowledge base below" (`:132`), but the full KB is embedded in the prompt. There is no enforcement mechanism — Gemini could still hallucinate.

### Full KB to Gemini

Yes — the entire knowledge base is serialized into the `SYSTEM_PROMPT`:

```javascript
// AIAssistant.vue :152
return `...KNOWLEDGE BASE\n${sections.join('\n\n')}`
```

### Conversation History to Gemini

Yes — last 6 messages:

```javascript
// AIAssistant.vue :351-352
const context = buildContextPrompt()
const fullPrompt = context ? `${context}\nVisitor: ${userQuestion}` : userQuestion
```

### What Actually Happens

1. Voice transcript → `searchKnowledgeBase()` (TF-IDF local search)
2. If score >= 0.5 → return local answer (no Gemini call)
3. If score < 0.5 → send to Gemini with full KB in system prompt
4. Gemini response returned as-is

---

## 8. API and Security Review

| Finding | Severity | Evidence |
|---------|----------|----------|
| Gemini API key in client bundle | **Critical** | `import.meta.env.VITE_GEMINI_API_KEY` in `:106` — Vite inlines `VITE_*` vars into the JS bundle |
| API key in fetch URL | **Critical** | `?key=${GEMINI_API_KEY}` in `:359` — visible in network tab and bundle |
| No backend proxy | **High** | Direct `fetch()` to `generativelanguage.googleapis.com` from browser |
| No CORS restriction | **Medium** | Google API allows browser requests, but key is exposed |
| Rate limiting is client-side only | **Medium** | `RATE_LIMIT_MS = 2000` at `:195` — trivially bypassed |
| No abuse protection | **High** | Anyone with the key can exhaust the quota |
| Prompt injection risk | **Medium** | User input goes directly to Gemini via `fullPrompt` at `:352` |
| KB reveals PII | **Low** | Email, phone, location in KB — intentional for portfolio |
| Speech data not sent to third parties | **Informational** | All speech processing is client-side Web Speech API |
| No HTTPS enforcement | **Medium** | No redirect logic; microphone requires HTTPS in production |
| `VITE_` prefix exposes to client | **Critical** | By Vite design, `VITE_*` vars are bundled into client code |

### API Key Masking in Report

```
Key format: AIzaSy********
Location: dist/assets/index-*.js (bundled)
Exposure: Public to all website visitors
```

---

## 9. Browser and Device Compatibility

| Browser | STT | TTS | Voice Mode | Notes |
|---------|-----|-----|------------|-------|
| Chrome Desktop | Yes | Yes | Full | Best support |
| Chrome Android | Yes | Yes | Full | Microphone requires HTTPS |
| Safari macOS | Yes (webkit) | Yes | Partial | `onend` may not fire reliably |
| Safari iOS | Yes (webkit) | Limited | Partial | Background tab kills speech; strict mic permissions |
| Firefox | **No** | Yes | No STT | `SpeechRecognition` not supported |
| Edge | Yes | Yes | Full | Chromium-based, same as Chrome |

### Key Limitations

1. **Firefox:** No `SpeechRecognition` — voice mode button hidden, text-only mic hidden
2. **iOS Safari:** `speechSynthesis` can stop in background tabs; no workaround
3. **Android Chrome:** Microphone requires HTTPS; HTTP will deny permission
4. **Offline:** All voice features require network (Gemini API); local search works offline but is limited
5. **Arabic voices:** Quality varies by OS; Android typically has better Arabic TTS than desktop

---

## 10. UX and Accessibility Review

| Check | Status | Evidence |
|-------|--------|----------|
| Mic button labels | **Pass** | `aria-label="Stop recording"` / `"Voice input"` (:114-115) |
| Speaker button labels | **Pass** | `aria-label="Read aloud"` (:41) |
| Keyboard navigation | **Pass** | Escape key handled (`:254`), focus management in `toggleChat()` |
| Focus states | **Pass** | `:focus-visible` outlines on all interactive elements |
| Screen-reader support | **Pass** | `role="dialog"`, `aria-live="polite"`, `aria-label` on regions |
| Listening indicator | **Pass** | Pulsing red mic + "Listening..." status text |
| Speaking indicator | **Pass** | Green dot + "Speaking..." status text |
| Error messages | **Pass** | Permission denied shows user-friendly message (`:615`) |
| Loading states | **Pass** | Typing indicator (three dots animation) |
| Mobile layout | **Pass** | Responsive at 480px breakpoint (`:548`) |
| Reduced motion | **Pass** | `prefers-reduced-motion: reduce` disables animations (`:525`) |
| Color not sole indicator | **Pass** | Status text accompanies colored dots |

### Issues

1. **No haptic feedback on mobile** — recording start/stop has no vibration cue
2. **Status text small** — 0.8rem font size may be hard to read
3. **No "how to use" tooltip** — first-time users may not discover voice mode

---

## 11. Performance Review

| Metric | Value | Impact |
|--------|-------|--------|
| API calls per voice interaction | 0 (local) or 1 (Gemini) | Low |
| TTS calls per response | 1 | Low |
| Recognition restarts | 1 per conversation turn | Low |
| Event listener cleanup | Proper (`onBeforeUnmount`) | None |
| Bundle impact | ~127KB JS (includes Vue + all components) | Acceptable |
| Blocking operations | None (all async) | None |
| Latency: speech → AI response | ~200-2000ms (local: ~1ms, Gemini: ~500-2000ms) | Acceptable |
| Latency: response → audio | ~100ms (TTS init) | Acceptable |

### Optimization Opportunities

1. **Lazy-load AIAssistant.vue** — currently bundled in main chunk
2. **Debounce `buildIDF()`** — recalculates IDF on every `findBestMatch()` call
3. **No streaming** — Gemini response is waited for in full before TTS begins

---

## 12. Error and Edge-Case Review

| Scenario | Behavior | Evidence |
|----------|----------|----------|
| Empty transcript | Re-listens after 500ms | :577-580 |
| Very short transcript (<2 chars) | Re-listens after 500ms | :577 |
| Long transcript | Sent as-is | :598 |
| Arabic input | Detected, sent to `ar-EG` recognition | :260 |
| English input | Detected, sent to `en-US` recognition | :261 |
| Mixed Arabic/English | Treated as Arabic if >30% Arabic chars | :266 |
| Mic permission denied | Error message shown, voice mode disabled | :614-619 |
| No microphone available | Button hidden (`v-if="voiceApiSupported"`) | :30 |
| Recognition timeout | `no-speech` error → auto-restart 800ms | :620 |
| Network failure | Gemini catch → fallback message | :400 |
| Gemini 400/403 | Config error message | :374 |
| Gemini quota exceeded | Generic error message | :398 |
| User speaks while assistant speaks | **Mic disabled** — cannot interrupt | :97 |
| User clicks mic multiple times | Guard: `if (isListening.value) return` | :553 |
| User closes chat while speaking | `endVoiceChat()` stops everything | :542 |
| Component unmount during recognition | `onBeforeUnmount` cleanup | :517 |
| Browser no support | Features hidden gracefully | :208-211 |

### Unhandled Edge Cases

1. **Speech loop on `no-speech`** — if the user is silent, recognition keeps restarting every 800ms indefinitely
2. **Gemini empty response** — `data.candidates[0].content` could be undefined; fallback message handles this
3. **Multiple rapid mic clicks** — `isListening` guard prevents this but `start()` could throw if already started

---

## 13. Comparison with Full Voice AI Portfolio

| Feature | Current Status | Evidence | Required Implementation |
|---------|---------------|----------|------------------------|
| Start voice mode | **Implemented** | `toggleVoiceMode()` | — |
| User speaks | **Implemented** | `handleRecognitionResult()` | — |
| Transcript finalized | **Implemented** | `interimResults: false` | — |
| Auto-send message | **Implemented** | `autoSendVoice()` | — |
| RAG retrieves context | **Partial** | TF-IDF keyword search only | Vector embeddings, semantic search |
| AI Agent answers | **Partial** | Gemini with system prompt | Tool calling, function calling |
| Assistant speaks automatically | **Implemented** | `speakTextAuto()` | — |
| Avatar reflects speaking state | **Not implemented** | No avatar component | Animated avatar with lip-sync |
| User can interrupt | **Partial** | `stopSpeaking()` exists but mic disabled during speech | Enable mic during speech, cancel TTS on new input |
| Conversation continues | **Implemented** | `handleRecognitionEnd()` loop | — |
| User ends voice mode | **Implemented** | `endVoiceChat()` | — |
| Voice Activity Detection | **Not implemented** | Uses fixed recording sessions | VAD for natural conversation |
| Speaker diarization | **Not implemented** | Single speaker assumed | N/A for single-user |
| Wake word | **Not implemented** | Manual activation only | Optional wake word detection |
| Multi-turn context | **Partial** | Last 6 messages sent to Gemini | Persistent conversation memory |

---

## 14. Recommendations

### P0 — Must Fix

1. **Move Gemini API key to server-side proxy**
   - Current: Key exposed in client bundle (`VITE_GEMINI_API_KEY`)
   - Fix: Create a Cloudflare Worker / Vercel Edge Function proxy
   - Files: New `api/gemini.js`, modify `callGeminiAPI()` in AIAssistant.vue
   - Risk: Key abuse, quota exhaustion

2. **Allow mic interrupt during speech**
   - Current: Mic disabled while `isSpeaking = true`
   - Fix: Enable mic, cancel TTS on new transcript
   - Files: AIAssistant.vue template + `handleRecognitionResult()`
   - Risk: Feedback loop (user's TTS audio captured by mic)

3. **Add confidence threshold**
   - Current: All transcripts accepted regardless of confidence
   - Fix: Reject transcripts below confidence threshold (e.g., 0.5)
   - Files: `handleRecognitionResult()` at :573

### P1 — Important Improvements

4. **Fix feedback loop on interrupt**
   - Add echo cancellation hint: `recognition.abort()` before `speakTextAuto()`
   - Add short delay before restarting recognition after TTS ends

5. **Add explicit voice selection**
   - Call `speechSynthesis.getVoices()` and select best Arabic/English voice
   - Cache voice selection

6. **Add backend proxy for Gemini**
   - Prevents key exposure
   - Enables server-side rate limiting
   - Allows streaming responses

7. **Stop `no-speech` restart loop**
   - Add max retry count (e.g., 3 silent attempts → stop)
   - Show "I didn't hear anything" message

8. **Add `confidence` threshold to STT**
   - Low-confidence transcripts produce poor UX
   - Show "Did you say...?" confirmation for uncertain transcripts

### P2 — Optional Enhancements

9. **Lazy-load AIAssistant component**
   - Reduce initial bundle size

10. **Add avatar synchronization**
    - Animated avatar that lip-syncs during TTS

11. **Add VAD (Voice Activity Detection)**
    - Use `AudioContext` + `AnalyserNode` for natural conversation flow

12. **Add streaming Gemini responses**
    - Start TTS before full response is received
    - Improve perceived latency

13. **Add persistent conversation memory**
    - Store conversation in `localStorage`

14. **Add dynamic navigation**
    - "Take me to the projects section" → scroll navigation

---

## 15. Implementation Roadmap

### Phase 1: Stabilize Existing Voice Features
**Duration:** 1-2 days

| Task | Files | Acceptance Criteria |
|------|-------|-------------------|
| Add confidence threshold | AIAssistant.vue | Low-confidence transcripts rejected |
| Fix `no-speech` restart loop | AIAssistant.vue | Max 3 silent retries before stopping |
| Add explicit voice selection | AIAssistant.vue | `getVoices()` called, best voice selected |
| Add feedback-loop prevention | AIAssistant.vue | Recognition aborts before TTS starts |
| Test Firefox graceful degradation | AIAssistant.vue | Voice features hidden, text chat works |

### Phase 2: Complete Voice Chat Mode
**Duration:** 2-3 days

| Task | Files | Acceptance Criteria |
|------|-------|-------------------|
| Enable mic during speech | AIAssistant.vue template | Mic button not disabled during speaking |
| Cancel TTS on new input | AIAssistant.vue | Speaking stops when user starts talking |
| Add "I didn't hear you" message | AIAssistant.vue | After 3 silent attempts |
| Add voice mode onboarding tooltip | AIAssistant.vue | First-use hint shown |

### Phase 3: RAG Improvements
**Duration:** 3-5 days

| Task | Files | Acceptance Criteria |
|------|-------|-------------------|
| Add vector embeddings | similarity.js, knowledge-base.json | Semantic search available |
| Add BM25 scoring | similarity.js | Keyword search improved |
| Add streaming responses | AIAssistant.vue, backend | First token arrives < 500ms |

### Phase 4: AI Agent and Tool Calling
**Duration:** 5-7 days

| Task | Files | Acceptance Criteria |
|------|-------|-------------------|
| Create backend proxy | api/gemini.js (new) | API key not in client |
| Add function calling | Backend | Agent can call tools |
| Add conversation memory | Backend + localStorage | Multi-session context |

### Phase 5: Avatar and Dynamic Navigation
**Duration:** 3-5 days

| Task | Files | Acceptance Criteria |
|------|-------|-------------------|
| Add animated avatar | New component | Lip-syncs during TTS |
| Add voice navigation | AIAssistant.vue | "Go to projects" scrolls page |
| Add wake word detection | New utility | Optional hands-free activation |

### Phase 6: Production Hardening
**Duration:** 2-3 days

| Task | Files | Acceptance Criteria |
|------|-------|-------------------|
| Server-side rate limiting | Backend | 10 req/min per IP |
| Add error monitoring | Analytics | Errors tracked in production |
| Add Lighthouse audit | CI/CD | Score > 90 |
| Add E2E voice tests | Tests | All voice paths tested |

---

## 16. Final Verdict

### What the system currently is

A **functional full voice chat mode** with continuous conversation, automatic sending, automatic TTS, and a clean UI. The implementation is well-structured with proper state management, lifecycle cleanup, and accessibility support.

### What it is not

- It is **not** a Voice AI Agent (no tool calling, no function calling, no dynamic navigation)
- It is **not** production-secure (API key exposed in client)
- It is **not** interrupt-capable (mic disabled during speech)
- It is **not** using RAG (TF-IDF keyword search only, no embeddings)

### Does it match a full Voice AI Agent?

**No.** It is a voice-enhanced chat widget. A full Voice AI Agent would include: tool calling, dynamic navigation, avatar synchronization, VAD, wake words, streaming responses, and a backend proxy.

### Minimum changes to reach full voice chat

1. Enable mic during speech + cancel TTS on new input (interrupt support)
2. Add feedback-loop prevention (echo cancellation)
3. Move API key to backend proxy
4. Add confidence threshold to STT

### Biggest production risk

**Gemini API key exposure** — anyone can extract it from the JS bundle and exhaust the quota or run up costs.

### Most valuable next feature

**Backend proxy for Gemini** — fixes the critical security issue, enables streaming, enables server-side rate limiting, and unblocks all future AI Agent features.

---

## Scorecard

| Category | Score |
|----------|-------|
| Voice input | 7/10 |
| Voice output | 7/10 |
| Continuous conversation | 7/10 |
| RAG integration | 4/10 |
| AI Agent capabilities | 2/10 |
| Error handling | 7/10 |
| Accessibility | 8/10 |
| Security | 2/10 |
| Production readiness | 4/10 |
| **Overall** | **5.4/10** |
