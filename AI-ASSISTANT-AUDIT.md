# AI Assistant Code Audit

**Last Updated:** September 5, 2026

---

## PART 1 — How the Current Implementation Actually Works

### 1. Where the user's question enters the system

The user types into an `<input>` field (`AIAssistant.vue:127-136`) bound to `userInput` via `v-model`. Pressing Enter triggers `@keyup.enter="sendMessage"`, or clicking the send button triggers `@click="sendMessage"`. Additionally, voice input is supported via the Web Speech API.

### 2. How the question is processed

`sendMessage()` (line 1008) runs:
1. Reads `userInput.value.trim()` — no sanitization, no length check
2. If voice chat is active, delegates to `processUserInput(text)` (line 1013)
3. Otherwise, pushes the raw text into `messages` array as `{ role: 'user', text }` via `addMessage()` (line 1017)
4. Clears `userInput`, sets `isTyping = true`
5. Checks local responses, intent detection, cache, then KB search, then Nara API fallback

### 3. Response Processing Pipeline

`AIAssistant.vue:1026-1068` — `sendMessage()`:
1. **Local Response Check** (line 1026): Checks `localResponses` for common phrases (greetings, thanks, goodbye, followup)
2. **Intent Detection** (line 1031): Calls `detectIntent(text)` from `intent-detector.js`
3. **Cache Check** (line 1039): Looks up `queryCache` Map for normalized question
4. **KB Search** (line 1044): Calls `searchKnowledgeBase(text, knowledgeBase)`
5. **Nara API Fallback** (line 1052): If KB misses, calls `callNaraAPI()`
6. **Fallback Message** (line 1059): Generic response if all else fails

### 4. How TF-IDF/tokenization works

`similarity.js:25-31` — `tokenize()`:
1. Lowercases the entire string
2. Strips everything except `\w`, `\s`, and Arabic range `\u0600-\u06FF`
3. Splits on whitespace
4. Filters out single-character tokens (length < 2 removed)

`similarity.js:33-40` — `normalizeArabic()`:
- Removes diacritics (`\u0610-\u061A`)
- Removes tatweel (`\u0640`)
- Normalizes alef variants (`\u0622`, `\u0623`, `\u0625`) → `\u0627`
- Converts ta marbuta (`\u0629`) → ha (`\u0647`)
- Converts alef maqsura (`\u0649`) → ya (`\u064A`)

`similarity.js:42-45` — `removeStopWords()`:
- Filters out Arabic stop words (27 tokens) or English stop words (47 tokens)

`similarity.js:47-53` — `termFrequency()`:
- Counts raw occurrences of each token

`similarity.js:55-69` — `buildIDF()`:
- Computes Inverse Document Frequency across all candidate documents
- Formula: `Math.log((N + 1) / (count + 1)) + 1`

`similarity.js:71-77` — `tfidfVector()`:
- Multiplies term frequency by IDF weight for each term

### 5. What content is searched

`similarity.js:170-209` — `searchBilingualKB()` builds candidates from `knowledgeBase.intents`:

| # | Intent ID | Searchable text content |
|---|-----------|------------------------|
| 1 | `identity` | Keywords + questions (AR/EN) |
| 2 | `experience` | Keywords + questions (AR/EN) |
| 3 | `education` | Keywords + questions (AR/EN) |
| 4 | `skills` | Keywords + questions (AR/EN) |
| 5 | `content_types` | Keywords + questions (AR/EN) |
| 6 | `industries` | Keywords + questions (AR/EN) |
| 7 | `projects` | Keywords + questions (AR/EN) |
| 8 | `case_studies` | Keywords + questions (AR/EN) |
| 9 | `certifications` | Keywords + questions (AR/EN) |
| 10 | `approach` | Keywords + questions (AR/EN) |
| 11 | `differentiator` | Keywords + questions (AR/EN) |
| 12 | `contact` | Keywords + questions (AR/EN) |
| 13 | `availability` | Keywords + questions (AR/EN) |

Each intent provides language-specific keywords and questions for matching.

### 6. How the similarity score is calculated

`similarity.js:124-168` — `findBestMatch()`:
1. Detects query language (`detectLanguage()`)
2. Preprocesses query: normalize → tokenize → remove stop words (line 126)
3. Tokenizes query into `queryTF` (term frequency object)
4. Builds IDF from all candidate documents (line 140)
5. Iterates over ALL candidates (~13 entries)
6. For each candidate: tokenizes, builds candidate TF, computes TF-IDF vectors
7. Calculates cosine similarity between vectors (line 151)
8. Applies keyword exact match boost: `score = score * 0.7 + boost * 0.3` (line 155)
9. Tracks the highest score

`cosineSimilarity()` (line 79-95): standard dot-product / (magnitude_A × magnitude_B).

`keywordExactMatchBoost()` (line 97-108): boosts score when query tokens match candidate keywords exactly or via substring matching.

### 7. Where the 0.5 threshold is applied

`similarity.js:124` — `findBestMatch(query, candidates, threshold = 0.5)` default threshold is 0.5.

`similarity.js:166` — `found: bestScore >= threshold`

`AIAssistant.vue:768` — `if (kbResult.found)` returns the local answer.

### 8. What happens when score >= 0.5

`AIAssistant.vue:769-781`: The local pre-computed answer from `searchKnowledgeBase()` is returned directly. No Nara API call. The response is cached via `setCachedResponse()`.

### 9. What happens when score < 0.5

`AIAssistant.vue:784`: `callNaraAPI(text, buildKnowledgeContext(text))` is called with the user question AND relevant KB context.

### 10. Exactly what data is sent to Nara API

`AIAssistant.vue:933-1006` — `callNaraAPI()`:
```js
fetch('/api/nara/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${BYNARA_API_KEY}`
  },
  body: JSON.stringify({
    model: 'longcat-2.0-free',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT + kbSection },
      { role: 'user', content: userQuestion }
    ],
    temperature: 0.7,
    max_tokens: 512
  })
})
```

The request contains:
- **system**: The `SYSTEM_PROMPT` (line 190-209) built from `knowledge-base.json` intents + optional KB context section
- **user message**: The raw user question

### 11. Whether conversation history is sent to Nara API

**No.** Only the current `userQuestion` is sent in the messages array. Previous messages from `messages[]` are stored in `conversationHistory` (line 219) but NOT sent to the API.

### 12. Whether previous questions are sent to Nara API

**No.** Each call to `callNaraAPI()` sends only the current question. If a user asks 5 questions, Nara sees 5 independent requests with no context linking them.

### 13. Whether the response is cached

**Yes.** In-memory caching exists:
- `queryCache` Map (line 221) with `CACHE_MAX = 50` entries
- `getCachedResponse()` (line 896-898): looks up normalized question
- `setCachedResponse()` (line 901-907): stores with LRU eviction

Cache is lost on page refresh (in-memory only).

### 14. Whether repeated questions create repeated API requests

**No for same session.** The cache prevents duplicate calls for the same question within a session. However, page refresh clears the cache.

### 15. Whether there is any request debounce/throttling

**No.** The only protection is `isTyping` (line 1010, 1019, 1071) — the send button is disabled and Enter is ignored while a response is loading. This prevents double-clicking but doesn't prevent rapid sequential sends after each response completes.

### 16. Whether there is any per-session request limit

**No.** A user can send unlimited messages in a single session.

### 17. Whether there is any protection against spam or automated requests

**No.** There is no rate limiting, no CAPTCHA, no request counting, no cooldown timer. An automated script could spam the API with requests.

### 18. What happens when the API returns an error

`AIAssistant.vue:980-991`:
- **402, 403, 429**: Disables Nara for 60 seconds via `disableNaraForSession()`
- **Other HTTP errors**: Returns `null`, falls through to fallback message
- **Network failure**: Caught by outer `catch`, returns `null`

`AIAssistant.vue:1058-1064`: Falls back to generic message.

### 19. What happens when the API key is missing or invalid

`AIAssistant.vue:936-938`: `if (!isNaraConfigured())` returns `null`. The chat works but only answers from local search and intent detection.

### 20. Whether the API key can be exposed to visitors through the browser

**Yes.** `VITE_BYNARA_API_KEY` is in the client bundle via Vite's `import.meta.env` inlining. However, the API is proxied through `/api/nara/v1/chat/completions` (line 966), so the key is NOT directly exposed if the proxy is configured correctly.

---

## PART 2 — Request Flow Diagram

```
Visitor types question
         │
         ▼
sendMessage()                    [AIAssistant.vue:1008]
         │
         ▼
userInput.value.trim()           [AIAssistant.vue:1009]
         │
         ├── Voice active → processUserInput(text)
         │
         ▼
addMessage('user', text)         [AIAssistant.vue:1017]
         │
         ▼
detectLocalResponse(text)        [AIAssistant.vue:1026]
    │
    ├── MATCH → return local response → DONE
    │
    ▼
detectIntent(text)               [intent-detector.js:102]
    │
    ├── navigate → scroll to section → DONE
    ├── greeting → return greeting → DONE
    │
    ▼
getCachedResponse(text)          [AIAssistant.vue:1039]
    │
    ├── HIT → return cached answer → DONE
    │
    ▼
searchKnowledgeBase(text, kb)    [similarity.js:170]
         │
         ▼
searchBilingualKB(query, kb)     [similarity.js:177]
         │
         ▼
Build candidates from intents[]  [similarity.js:181-192]
         │
         ▼
findBestMatch(query, candidates) [similarity.js:124]
         │
         ├── detectLanguage(query)
         ├── preprocessQuery() → tokenize → removeStopWords
         ├── buildIDF(allCandidateDocs)
         ├── for each candidate:
         │       tokenize → termFrequency → tfidfVector
         │       cosineSimilarity(vecA, vecB)
         │       keywordExactMatchBoost()
         │       score = score * 0.7 + boost * 0.3
         └── track best score
         │
         ▼
score >= 0.5?                    [similarity.js:166]
    │
    ├── YES → cache answer → return → DONE
    │
    └── NO
         │
         ▼
callNaraAPI(text, kbContext)     [AIAssistant.vue:933]
         │
         ▼
isNaraConfigured()               [AIAssistant.vue:936]
    │
    ├── NO → return null → fallback message → DONE
    │
    ▼
isNaraAvailable()                [AIAssistant.vue:941]
    │
    ├── NO (disabled) → return null → DONE
    │
    ▼
fetch('/api/nara/v1/chat/completions')
    body: {
      model: 'longcat-2.0-free',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + kbContext },
        { role: 'user', content: question }
      ],
      temperature: 0.7,
      max_tokens: 512
    }
         │
    ┌────┴────┐
    │         │
 success   error
    │         │
    ▼         ▼
 extract   return null
 text         │
    │         ▼
    ▼      fallback message
 cache response
    │
    ▼
  DONE
```

---

## PART 3 — API Usage Analysis

### What avoids API calls

The 13 intent categories with bilingual keywords + questions = search targets. For direct questions like "Who is Shymaa?" or "What certifications does she have?", the TF-IDF + keyword boost scores >= 0.5. These questions never hit the API.

### What likely hits the API

Any question that doesn't share keyword overlap with the KB text. Examples:
- "Can she help with Instagram growth?" — no "growth" in KB
- "What's her rate?" — no pricing info in KB
- "Does she work with startups?" — no "startup" keyword
- Questions in mixed languages or colloquial dialects

### Can the same question trigger API multiple times?

**No.** The `queryCache` prevents this within a session. However, page refresh clears the cache.

### Does refreshing the page reset everything?

**Yes.** All state is in-memory Vue refs. Refreshing clears messages, cache, and conversation history.

### Does opening multiple tabs create independent usage?

**Yes.** Each tab loads its own JS bundle, has its own state, and makes independent API calls.

### Does the current implementation have practical request protection?

**Minimal.** The `isTyping` flag prevents sending while waiting. The `queryCache` prevents duplicates. Beyond that: unlimited requests per session, no cooldown, no rate limiting.

### What can't be determined without analytics

- Actual percentage of questions that hit the API
- How many users actually use the chat vs. ignore it
- Whether Arabic visitors commonly use the chat
- How many sessions happen per day

For a personal portfolio, these numbers are likely very small (single digits per day, if any).

---

## PART 4 — Token / Cost Analysis

### 1. Knowledge base data per API request

The `SYSTEM_PROMPT` (line 190-209) contains:
- Profile info: ~50 words
- 13 intents with keywords + questions + answers: ~800 words total

**Estimated system prompt: ~850 words ≈ 1,100 tokens**

Plus optional KB context from `buildKnowledgeContext()`: ~400 words ≈ 550 tokens

Plus the user question: ~10-20 words ≈ 15-25 tokens

**Total input per API call: ~1,100-1,675 tokens**

### 2. Is the KB sent every time?

**Yes.** The `SYSTEM_PROMPT` is constant and sent on every call. Nara receives the full KB regardless of what the question is about.

### 3. Does conversation history increase request size?

**No.** History is not sent. Only the current question.

### 4. Does the API receive more information than necessary?

**Yes.** If someone asks "What certifications does Shymaa have?" and the local search misses, the API receives the entire KB including projects, industries, approach, identity, etc.

### 5. Could local search results replace the full KB?

**Yes.** If the local search returned the *category* of the best match (even if below threshold), the API could receive only that category's data instead of the full KB.

### 6. Could a smaller prompt produce the same result?

**Yes.** Two opportunities:
1. **Category filtering**: Send only relevant KB sections (~100-200 tokens instead of ~1,100)
2. **System prompt trimming**: The rules section could be shorter; the KB data is the real payload

### Qualitative optimization estimate

| Optimization | Token reduction | Complexity |
|-------------|----------------|------------|
| Send only relevant category | ~60-70% | Low |
| Shorter system prompt rules | ~10% | Low |
| Remove project URLs from prompt | ~15% | Trivial |
| Use `max_tokens` to control output | Controls cost, not input | Already done |

---

## PART 5 — Security Review

### Is VITE_BYNARA_API_KEY exposed to the browser?

**Depends on deployment.** The API endpoint is `/api/nara/v1/chat/completions` (line 966), suggesting a proxy. If the proxy is server-side, the key is NOT exposed. If the key is used client-side without a proxy, it would be exposed.

### Can a visitor extract the key?

**If proxy is server-side:** No. The key never reaches the browser.
**If no proxy:** Yes, via DevTools → Sources.

### Can someone reuse the key outside the portfolio?

**If proxy is server-side:** No. The proxy validates the origin.
**If no proxy:** Yes. The key works for any API call.

### Can someone automate requests against the key?

**If proxy is server-side:** Limited. The proxy can enforce rate limiting.
**If no proxy:** Yes. No CAPTCHA, no rate limiting.

### Risk assessment for a personal portfolio

**Low practical risk:**
- API proxy protects the key (if configured)
- The `disableNaraForSession()` function handles 402/403/429 errors gracefully
- The chat falls back to local-only answers if API is unavailable
- For a personal portfolio, traffic is likely very low

---

## PART 6 — Architecture Options

### Option A — Keep Current Architecture

**Local TF-IDF → Nara API fallback (as-is)**

**Advantages:**
- Already built, zero new work
- Simple to understand and maintain
- API proxy protects the key
- 13 intent categories with bilingual support
- Response caching prevents duplicate calls
- Arabic/English language detection and normalization

**Disadvantages:**
- No rate limiting — vulnerable to abuse
- Full KB sent on every API call regardless of question type
- No conversation context (each question independent)
- TF-IDF is word-overlap only — can't handle synonyms or rephrasing
- Cache is in-memory only (lost on refresh)

**Complexity:** Zero (already done)
**Expected API usage:** Low for portfolio traffic
**Sufficient?** Yes for a personal portfolio.

---

### Option B — Optimized Client-Side Hybrid

**Keep client-side architecture, add practical improvements.**

**Useful improvements:**

| Improvement | Value | Worth it? |
|------------|-------|-----------|
| **Session request limit** (e.g., 10 API calls max) | Prevents abuse | **Yes — high value, trivial** |
| **Cooldown timer** (e.g., 3 seconds between sends) | Prevents rapid-fire | **Yes — medium value, trivial** |
| **Send only relevant KB category to API** | Reduces tokens by ~60% | **Yes — reduces cost, medium effort** |
| **Add more intents/keywords** | More questions handled locally | **Yes — high value, trivial** |
| **Lower threshold to 0.4** | More questions answered locally | **Yes — immediate API reduction** |

**Unnecessary improvements:**
- Debounce on typing — the input is already gated by `isTyping`
- localStorage persistence — page refresh is fine for a portfolio
- WebSocket — overkill for a single-page chat
- Analytics on chat usage — already has basic tracking

**Complexity:** Low
**Expected API usage:** Very low (most questions handled locally + cached)
**Sufficient?** Yes for a personal portfolio.

---

### Option C — Secure Server-Side API Proxy

**Browser → your backend → Nara API**

```
Browser
  │
  ▼
Your serverless endpoint (e.g., Cloudflare Worker)
  │
  ├── Rate limiting (per IP)
  ├── Request validation
  ├── API key stored as server secret
  ├── Optional: response caching
  │
  ▼
Nara API (key never leaves server)
```

**Advantages:**
- API key hidden from browser
- Can enforce rate limits
- Can validate/sanitize requests server-side
- Can cache responses server-side (shared across all visitors)
- Can filter out obviously malicious requests

**Disadvantages:**
- Adds infrastructure (serverless function + deployment)
- Adds complexity to the project
- Requires hosting a backend (even if serverless)
- Adds latency (extra hop)
- More moving parts to maintain

**Complexity:** Medium
**Worth it for a personal portfolio?** Probably not, unless:
- The key has been compromised and needs rotation
- The portfolio gets unexpectedly high traffic
- There's a specific abuse concern

---

## PART 7 — Recommendation

**Recommended: Option A — Keep Current Architecture**

Reasoning:
1. **This is a personal portfolio**, not a SaaS product
2. The API proxy protects the key (if configured correctly)
3. Response caching prevents duplicate calls
4. 13 bilingual intent categories handle most common questions locally
5. Adding a backend introduces deployment complexity that isn't justified
6. If the portfolio ever gets enough traffic to warrant a backend, it's a good problem to have

**Optional enhancements from Option B** (if desired):
- Add session request limit (10 calls max)
- Add cooldown timer (3 seconds)
- Consider lowering threshold to 0.4

---

## PART 8 — Recommended Request Flow

```
Visitor types question
         │
         ▼
Normalize question                [lowercase, trim, strip punctuation]
         │
         ▼
Check response cache (Map)        [exact or normalized match]
    │
    ├── HIT → return cached answer → DONE
    │
    └── MISS
         │
         ▼
Check session request count       [if implemented]
    │
    ├── >= 10 → "Please contact Shymaa directly" → DONE
    │
    └── < 10
         │
         ▼
searchKnowledgeBase(query, kb)    [TF-IDF + keyword boost]
         │
         ▼
score >= 0.5?                     [current threshold]
    │
    ├── YES → cache answer → return → DONE
    │
    └── NO
         │
         ▼
Get best-match category type      [e.g., "certifications"]
         │
         ▼
Build RELEVANT prompt             [only that category's KB data]
         │
         ▼
Increment session counter         [if implemented]
         │
         ▼
callNaraAPI(question, prompt)
         │
         ▼
Cache response                    [question → answer]
         │
         ▼
Return answer → DONE
```

---

## PART 9 — Prioritized Optimization Checklist

### P0 — Must fix

| # | Issue | Fix | Files |
|---|-------|-----|-------|
| 1 | Full KB sent on every API call | Send only the matched category's data | `AIAssistant.vue`, `similarity.js` |
| 2 | No session request limit | Add counter, max 10 per session | `AIAssistant.vue` |

### P1 — Recommended

| # | Issue | Fix | Files |
|---|-------|-----|-------|
| 3 | Threshold might be too high | Consider lowering to 0.4 for more local matches | `similarity.js` |
| 4 | No send cooldown | Add 2-3 second minimum between sends | `AIAssistant.vue` |
| 5 | Cache is in-memory only | Acceptable for portfolio (optional: localStorage) | `AIAssistant.vue` |
| 6 | Only 13 intents | Add more intents for edge cases | `knowledge-base.json` |

### P2 — Optional

| # | Issue | Fix | Files |
|---|-------|-----|-------|
| 7 | No conversation context | Send last 2-3 messages in `contents` array | `AIAssistant.vue` |
| 8 | No temperature control | Already set to 0.7 (current) | `AIAssistant.vue` |
| 9 | No error logging/monitoring | Add basic console.warn counts for debugging | `AIAssistant.vue` |
| 10 | No loading state UX beyond dots | Could add "Searching..." or "Thinking..." text | `AIAssistant.vue` |

---

## PART 10 — Implementation Plan

### Phase 1: Session Limits + Cooldown (P0-P1)
**Files:** `AIAssistant.vue`
**What:** Add a `sessionRequestCount` ref, `SESSION_LIMIT = 10` constant, and a 3-second cooldown between sends.
**Why:** Prevents abuse. Simple to implement.
**Benefit:** Near-zero abuse risk.
**Risk:** Minimal.

### Phase 2: Reduce API Prompt Size (P0)
**Files:** `AIAssistant.vue`, `similarity.js`
**What:** Instead of always sending the full KB as system prompt, send only the relevant category. Modify `searchKnowledgeBase()` to return the `type` of the best match (even when below threshold). Use that type to build a targeted prompt with only that section's data.
**Why:** Reduces tokens per API call by ~60-70%. Reduces cost. Faster response.
**Benefit:** Each API call uses ~300-500 tokens input instead of ~1,100-1,675.
**Risk:** API might give less accurate answers with less context. The system prompt rules still guide it. Test accuracy.

### Phase 3: Threshold Tuning (P1)
**Files:** `similarity.js`
**What:** Test with various questions and consider lowering threshold from 0.5 to 0.4 if too many questions hit the API.
**Why:** More questions answered locally = fewer API calls.
**Benefit:** Immediate API reduction.
**Risk:** Lower threshold might cause false positives (returning wrong local answers). Test with variety of questions.

### Phase 4: UX Polish (P2)
**Files:** `AIAssistant.vue`
**What:** Add a small delay animation before the typing indicator appears. Consider adding "Searching..." text.
**Why:** Improves perceived performance.
**Benefit:** Better UX.
**Risk:** Minimal.

---

## Final Verdict

**1. Is the current AI Assistant architecture good enough for a personal portfolio?**
Yes. It works, it's simple, and for low-traffic personal use it functions correctly. The bilingual support (Arabic/English) with proper normalization and stop word removal is well-implemented.

**2. Is the API being used efficiently?**
Partially. The full KB is sent on every call regardless of question type, but response caching prevents duplicate calls. The 0.5 threshold is reasonable.

**3. What is the biggest unnecessary source of API usage?**
Full KB sent on every call when only a fraction is relevant. Category filtering would reduce tokens by ~60-70%.

**4. What is the biggest security issue?**
The API key exposure depends on whether a proxy is configured. If `/api/nara/v1/chat/completions` is a server-side proxy, the key is protected. If not, the key is exposed in the client bundle.

**5. What is the simplest improvement with the biggest impact?**
Category filtering — send only the relevant KB section to the API instead of the full prompt. This reduces tokens by ~60-70% for every API call.

**6. Should we keep the current architecture or change it?**
Keep the current architecture (Option A). It's well-designed for a personal portfolio. Consider optional enhancements from Option B if needed.

**7. What should be the NEXT implementation step?**
Phase 1: Add session request limit + cooldown. This gives abuse protection with minimal effort.
