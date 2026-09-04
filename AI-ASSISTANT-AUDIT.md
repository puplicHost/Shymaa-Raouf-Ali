# AI Assistant Code Audit

## PART 1 — How the Current Implementation Actually Works

### 1. Where the user's question enters the system

The user types into an `<input>` field (`AIAssistant.vue:38-44`) bound to `userInput` via `v-model`. Pressing Enter triggers `@keyup.enter="sendMessage"`, or clicking the send button triggers `@click="sendMessage"`.

### 2. How the question is processed

`sendMessage()` (line 188) runs:
1. Reads `userInput.value.trim()` — no sanitization, no length check
2. Pushes the raw text into `messages` array as `{ role: 'user', text }`
3. Clears `userInput`, sets `isTyping = true`
4. Calls `getResponse(text)` (line 200)

### 3. How TF-IDF/tokenization works

`similarity.js:1-7` — `tokenize()`:
1. Lowercases the entire string
2. Strips everything except `\w`, `\s`, and Arabic range `\u0600-\u06FF`
3. Splits on whitespace
4. Filters out single-character tokens (length < 2 removed)

`similarity.js:9-15` — `termFrequency()`:
- Counts raw occurrences of each token. No IDF component exists — this is pure TF, not TF-IDF.

### 4. What content is searched

`similarity.js:64-168` — `searchKnowledgeBase()` builds `allTexts[]` with **~17 entries**:

| # | Type | Searchable text content |
|---|------|------------------------|
| 1-7 | `qa_pair` | Each question + answer concatenated (7 entries) |
| 8 | `skills` | `"skills " + all skills joined by space` |
| 9 | `experience` | role + responsibilities joined |
| 10 | `education` | degree + university + year + grade |
| 11 | `certifications` | all certifications joined |
| 12 | `industries` | all industries joined |
| 13 | `projects` | all project names + industries joined |
| 14 | `identity` | name + title + location + languages |
| 15 | `differentiator` | `"different unique why choose " + text` |
| 16 | `approach` | `"approach process how works " + steps joined` |

Note: the QA pairs are searched as individual entries, but skills/experience/etc. are each a single blob. A question like "What is her experience?" tries to match against one large string containing `current_role responsibilities.join(' ')`.

### 5. How the similarity score is calculated

`similarity.js:35-62` — `findBestMatch()`:
1. Tokenizes the user query into `queryTF` (term frequency object)
2. Iterates over ALL candidates (~17 entries)
3. For each candidate: tokenizes, builds candidate TF, computes cosine similarity
4. Tracks the highest score

`cosineSimilarity()` (line 17-33): standard dot-product / (magnitude_A × magnitude_B).

**Critical detail**: this compares raw term frequency vectors. If a user asks "Who is Shymaa?" the query tokens are `["who", "shymaa"]`. The best match is the QA pair with text `"Who is Shymaa? Shymaa Raouf Ali is a..."` — the word overlap produces a high score. But if someone asks "tell me about her background" — tokens `["tell", "me", "about", "her", "background"]` — none of these words appear strongly in any candidate, so the score will be low.

### 6. Where the 0.75 threshold is applied

`similarity.js:60` — `found: bestScore >= threshold` where `threshold` defaults to `0.75`.

`AIAssistant.vue:180` — `if (localResult.found)` returns the local answer.

### 7. What happens when score >= 0.75

`AIAssistant.vue:180-182`: The local pre-computed answer from `searchKnowledgeBase()` is returned directly. No Gemini call. No API request.

### 8. What happens when score < 0.75

`AIAssistant.vue:184`: `callGeminiAPI(input)` is called with the **raw user question string only**.

### 9. Exactly what data is sent to Gemini

`AIAssistant.vue:138-151`:
```js
fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: userQuestion }] }],
  }),
})
```

The request contains:
- **system_instruction**: The entire `SYSTEM_PROMPT` (line 74-112), which includes the **entire knowledge base** as flat text
- **contents**: A single user message with the raw question

No `generationConfig` (temperature, max tokens, etc.) is specified — uses Gemini defaults.

### 10. Whether the entire knowledge base is sent on every Gemini request

**Yes.** The `SYSTEM_PROMPT` constant (lines 74-112) embeds every field from `knowledge-base.json` via template literal interpolation. This is computed once at module load time, so it's not re-stringified per request — but it IS sent in every request's `system_instruction.parts[0].text`.

### 11. Whether conversation history is sent to Gemini

**No.** Only the current `userQuestion` is sent in `contents`. Previous messages from `messages[]` are not included. Gemini has no memory of the conversation.

### 12. Whether previous questions are sent to Gemini

**No.** Each call to `callGeminiAPI(input)` sends only the current question. If a user asks 5 questions, Gemini sees 5 independent requests with no context linking them.

### 13. Whether the response is cached

**No.** There is no caching anywhere — not in memory, not in localStorage, not in sessionStorage. The same question asked twice produces two Gemini API calls.

### 14. Whether repeated questions create repeated Gemini API requests

**Yes.** If a user types "What certifications does Shymaa have?" twice, the local search might catch the first (via the QA pair), but if it doesn't (score < 0.75), Gemini is called both times with identical payloads.

### 15. Whether there is any request debounce/throttling

**No.** The only protection is `isTyping` (line 190, 194, 207) — the send button is disabled and Enter is ignored while a response is loading. This prevents double-clicking but doesn't prevent rapid sequential sends after each response completes.

### 16. Whether there is any per-session request limit

**No.** A user can send unlimited messages in a single session.

### 17. Whether there is any protection against spam or automated requests

**No.** There is no rate limiting, no CAPTCHA, no request counting, no cooldown timer. An automated script could spam the Gemini API key with thousands of requests.

### 18. What happens when Gemini returns an error

`AIAssistant.vue:154-174`:
- **400 or 403**: Returns a hardcoded config-error message
- **Other HTTP errors**: Throws, caught by outer `catch`, returns generic error message
- **Network failure**: Caught by outer `catch`, returns generic error message
- **Invalid JSON response**: `response.json().catch(() => ({}))` handles parse failure

The user sees a friendly error message. The chat remains functional.

### 19. What happens when the API key is missing or invalid

`AIAssistant.vue:133`: `if (!GEMINI_API_KEY || !GEMINI_API_KEY.startsWith('AIzaSy'))` — returns a fallback message directing to email. No Gemini call is made. The chat works but only answers from local search.

### 20. Whether the API key can be exposed to visitors through the browser

**Yes, absolutely.** Confirmed by inspecting the built bundle at `dist/assets/index-CjdFPcX2.js`:

```
let t=`AIzaSyCJGb31hKH_DZB6YEhkp_RofOWdbk-QyCw`
```

The `VITE_` prefix means Vite inlines the env variable at build time into the JS bundle. Anyone can open DevTools → Sources → search for `AIzaSy` and extract the full key. The key is in the production `dist/` output.

---

## PART 2 — Request Flow Diagram

```
Visitor types question
         │
         ▼
sendMessage()                    [AIAssistant.vue:188]
         │
         ▼
userInput.value.trim()           [AIAssistant.vue:189]
         │
         ▼
getResponse(text)                [AIAssistant.vue:177]
         │
         ▼
searchKnowledgeBase(query, kb)   [similarity.js:64]
         │
         ▼
build allTexts[] (~17 entries)   [similarity.js:67-151]
         │
         ▼
findBestMatch(query, allTexts)   [similarity.js:35]
         │
         ├── tokenize(query) → queryTF
         ├── for each candidate:
         │       tokenize(candidate) → candidateTF
         │       cosineSimilarity(queryTF, candidateTF)
         └── track best score
         │
         ▼
result.found?                    [similarity.js:60]
    │                           (score >= 0.75)
    │
    ├── YES → return local answer → push to messages[] → DONE
    │
    └── NO
         │
         ▼
callGeminiAPI(input)             [AIAssistant.vue:132]
         │
         ▼
Validate API key format          [AIAssistant.vue:133]
    │
    ├── invalid → return fallback message → DONE
    │
    └── valid
         │
         ▼
fetch(GEMINI_ENDPOINT + key)     [AIAssistant.vue:138]
    body: {
      system_instruction: SYSTEM_PROMPT (entire KB),
      contents: [{ role: 'user', parts: [{ text: question }] }]
    }
         │
         ▼
    ┌────┴────┐
    │         │
 success   error
    │         │
    ▼         ▼
 extract   return error message
 text
    │
    ▼
 push to messages[]
    │
    ▼
   DONE
```

---

## PART 3 — Gemini Usage Analysis

### What avoids Gemini

The 7 QA pairs + 9 category blobs = 16 search targets. For direct questions like "Who is Shymaa?" or "What certifications does she have?", the TF overlap with the QA pair text is high enough to score >= 0.75. These questions never touch Gemini.

### What likely hits Gemini

Any question that doesn't share direct word overlap with the KB text. Examples:
- "Can she help with Instagram growth?" — no "growth" or "Instagram growth" in KB
- "What's her rate?" — no pricing info in KB
- "Does she work with startups?" — no "startup" keyword
- "Tell me about yourself" — low overlap with structured KB text
- Questions in Arabic — the KB text is all English, so Arabic questions will always have low similarity and always hit Gemini

**Key insight**: The TF-IDF approach is purely word-overlap based. It cannot understand semantic equivalence. "What does she do for a living?" and "What is her job?" would both score poorly because "job", "living", "for a" don't appear in the KB text.

### Can the same question trigger Gemini multiple times?

**Yes.** No deduplication. No caching. Ask the same question twice = two API calls.

### Does refreshing the page reset everything?

**Yes.** All state is in-memory Vue refs. Refreshing clears messages and any in-flight state.

### Does opening multiple tabs create independent usage?

**Yes.** Each tab loads its own JS bundle, has its own state, and makes independent API calls.

### Does the current implementation have practical request protection?

**No.** The only protection is the `isTyping` flag which prevents sending while waiting for a response. Beyond that: unlimited requests per session, no cooldown, no rate limiting.

### What can't be determined without analytics

- Actual percentage of questions that hit Gemini
- How many users actually use the chat vs. ignore it
- Whether Arabic visitors commonly use the chat
- How many sessions happen per day

For a personal portfolio, these numbers are likely very small (single digits per day, if any).

---

## PART 4 — Token / Cost Analysis

### 1. Knowledge base data per Gemini request

The `SYSTEM_PROMPT` string (lines 74-112) contains:

```
Identity: ~100 words
Experience: ~80 words (role + 6 responsibilities)
Education: ~20 words
Skills: ~30 words (10 items)
Content Types: ~25 words (8 items)
Industries: ~40 words (6 items)
Projects: ~80 words (6 items with URLs)
Certifications: ~40 words (7 items)
Approach: ~30 words (4 steps)
Differentiator: ~25 words
Rules: ~60 words
```

**Estimated system prompt: ~530 words ≈ 700 tokens**

Plus the user question: ~10-20 words ≈ 15-25 tokens

**Total input per Gemini call: ~715-725 tokens**

### 2. Is the KB sent every time?

**Yes.** The system prompt is constant and sent on every call. Gemini receives the full KB regardless of what the question is about.

### 3. Is the system prompt sent every time?

**Yes.** It's in `system_instruction.parts[0].text`, which Gemini processes on every request.

### 4. Does conversation history increase request size?

**No.** History is not sent. Only the current question.

### 5. Does Gemini receive more information than necessary?

**Yes.** If someone asks "What certifications does Shymaa have?" and the local search misses, Gemini receives the entire KB including projects, industries, approach, identity, etc. — all irrelevant to the question.

### 6. Could local search results replace the full KB?

**Yes.** If the local search returned the *category* of the best match (even if below threshold), Gemini could receive only that category's data instead of the full KB. For example, if the best local match was "certifications" with score 0.6, send only the certifications data to Gemini — not the entire KB.

### 7. Could a smaller prompt produce the same result?

**Yes.** Two opportunities:
1. **Category filtering**: Send only relevant KB sections (~100-200 tokens instead of ~700)
2. **System prompt trimming**: The rules section could be shorter; the KB data is the real payload

### Qualitative optimization estimate

| Optimization | Token reduction | Complexity |
|-------------|----------------|------------|
| Send only relevant category | ~60-70% | Low |
| Shorter system prompt rules | ~10% | Low |
| Remove project URLs from prompt | ~15% | Trivial |
| Use `generationConfig.maxOutputTokens` | Controls cost, not input | Trivial |

---

## PART 5 — Security Review

### Is VITE_GEMINI_API_KEY exposed to the browser?

**Yes.** Confirmed in `dist/assets/index-CjdFPcX2.js`:
```
let t=`AIzaSyCJGb31hKH_DZB6YEhkp_RofOWdbk-QyCw`
```

Vite's `import.meta.env.VITE_*` variables are inlined at build time into client-side bundles. This is by design for Vite — it does NOT have server-side env variable support like Next.js.

### Can a visitor extract the key?

**Yes.** Open DevTools → Sources → Search → `AIzaSy` → copy the key. Takes 5 seconds.

### Can someone reuse the key outside the portfolio?

**Yes.** The key works for any Gemini API call. Someone could use it for their own projects, effectively stealing the quota.

### Can someone automate requests against the key?

**Yes.** No CAPTCHA, no rate limiting, no origin validation. A script could:
1. Extract the key from the bundle
2. Call Gemini directly with arbitrary prompts
3. Exhaust the free tier quota

### Risk assessment for a personal portfolio

**Low-to-medium practical risk:**
- Gemini free tier gives 15 RPM / 1M tokens/day — hard to exhaust accidentally
- The key is for a personal project, not production infrastructure
- An attacker would need to specifically target this portfolio
- The main risk is quota exhaustion causing the chat to stop working for legitimate visitors

**If the free tier is exceeded**, Gemini returns 429 errors, and the chat falls back to local-only answers. The portfolio doesn't break — just the AI capability degrades.

---

## PART 6 — Architecture Options

### Option A — Keep Current Architecture

**Local TF-IDF → Gemini fallback (as-is)**

**Advantages:**
- Already built, zero new work
- Simple to understand and maintain
- No backend infrastructure
- Most questions likely handled locally

**Disadvantages:**
- API key fully exposed in client bundle
- No caching — same question = duplicate Gemini calls
- No rate limiting — vulnerable to abuse
- Full KB sent on every Gemini call regardless of question type
- No conversation context (each question independent)
- TF-IDF is word-overlap only — can't handle synonyms or rephrasing

**Complexity:** Zero (already done)
**Expected Gemini usage:** Low for portfolio traffic
**Sufficient?** Probably yes, but the key exposure is a real problem.

---

### Option B — Optimized Client-Side Hybrid

**Keep client-side architecture, add practical improvements.**

**Useful improvements:**

| Improvement | Value | Worth it? |
|------------|-------|-----------|
| **Response cache** (Map of question→answer) | Prevents duplicate Gemini calls for same question | **Yes — high value, trivial** |
| **Session request limit** (e.g., 5 Gemini calls max) | Prevents abuse | **Yes — high value, trivial** |
| **Cooldown timer** (e.g., 3 seconds between sends) | Prevents rapid-fire | **Yes — medium value, trivial** |
| **Normalize question** before search (trim, lowercase, remove stopwords) | Better TF-IDF matches | **Yes — medium value, low effort** |
| **Lower threshold to 0.6** | More questions answered locally | **Yes — immediate Gemini reduction** |
| **Send only relevant KB category to Gemini** | Reduces tokens by ~60% | **Yes — reduces cost, medium effort** |
| **Add more QA pairs** | More questions handled locally | **Yes — high value, trivial** |
| **Check FAQ match before TF-IDF** | Exact match = instant answer | **Yes — trivial** |

**Unnecessary improvements:**
- Debounce on typing — the input is already gated by `isTyping`
- localStorage persistence — page refresh is fine for a portfolio
- WebSocket — overkill for a single-page chat
- Analytics on chat usage — not needed unless debugging

**Complexity:** Low
**Expected Gemini usage:** Very low (most questions handled locally + cached)
**Sufficient?** Yes for a personal portfolio. The key exposure remains the main issue.

---

### Option C — Secure Server-Side Gemini Proxy

**Browser → your backend → Gemini API**

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
Gemini API (key never leaves server)
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

**Recommended: Option B — Optimized Client-Side Hybrid**

Reasoning:
1. **This is a personal portfolio**, not a SaaS product
2. Gemini free tier is generous (15 RPM, 1M tokens/day) — abuse is unlikely
3. The key exposure risk is real but low-impact for a free-tier personal project
4. Adding a backend introduces deployment complexity that isn't justified
5. The biggest wins come from simple client-side fixes (caching, lower threshold, more QA pairs, category filtering)
6. If the portfolio ever gets enough traffic to warrant a backend, it's a good problem to have

**The one exception**: if the API key has been publicly shared and needs to be rotated, a serverless proxy becomes worth considering.

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
Check session request count
    │
    ├── >= 5 → "Please contact Shymaa directly" → DONE
    │
    └── < 5
         │
         ▼
searchKnowledgeBase(query, kb)    [TF-IDF cosine similarity]
         │
         ▼
score >= 0.6?                     [lowered threshold]
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
Increment session counter
         │
         ▼
callGeminiAPI(question, prompt)
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
| 1 | API key exposed in client bundle | Either accept the risk OR migrate key to serverless proxy | `.env`, `AIAssistant.vue` |
| 2 | No response caching | Add `Map` cache keyed by normalized question | `AIAssistant.vue` |

### P1 — Recommended

| # | Issue | Fix | Files |
|---|-------|-----|-------|
| 3 | Same question → duplicate Gemini calls | Cache prevents this (P0 #2) | `AIAssistant.vue` |
| 4 | No session request limit | Add counter, max 5 per session | `AIAssistant.vue` |
| 5 | Threshold too high (0.75) | Lower to 0.55-0.6 to catch more local matches | `similarity.js` |
| 6 | Full KB sent on every Gemini call | Send only the matched category's data | `AIAssistant.vue`, `similarity.js` |
| 7 | No question normalization | Add basic normalization (lowercase, strip punctuation, remove stopwords) | `similarity.js` |
| 8 | No send cooldown | Add 2-3 second minimum between sends | `AIAssistant.vue` |
| 9 | Only 7 QA pairs | Add 10-15 more covering common questions | `knowledge-base.json` |

### P2 — Optional

| # | Issue | Fix | Files |
|---|-------|-----|-------|
| 10 | No conversation context | Send last 2-3 messages in `contents` array | `AIAssistant.vue` |
| 11 | No `maxOutputTokens` set | Add `generationConfig: { maxOutputTokens: 200 }` to control output length | `AIAssistant.vue` |
| 12 | No temperature control | Add `generationConfig: { temperature: 0.7 }` for consistent answers | `AIAssistant.vue` |
| 13 | No error logging/monitoring | Add basic console.warn counts for debugging | `AIAssistant.vue` |
| 14 | No loading state UX beyond dots | Could add "Searching..." or "Thinking..." text | `AIAssistant.vue` |

---

## PART 10 — Implementation Plan

### Phase 1: Response Caching + Session Limits (P0 + P1)
**Files:** `AIAssistant.vue`
**What:** Add a `responseCache` Map (normalized question → answer), a `sessionRequestCount` ref, and a `SESSION_LIMIT = 5` constant. Check cache before calling `getResponse()`. Check count before calling Gemini. Cache successful Gemini responses.
**Why:** Eliminates duplicate Gemini calls. Prevents abuse. Immediate Gemini usage reduction.
**Benefit:** ~50-70% reduction in Gemini calls for returning visitors. Near-zero abuse risk.
**Risk:** Cache only lives in memory (lost on refresh). Acceptable for portfolio.

### Phase 2: Improve Local Search (P1)
**Files:** `similarity.js`
**What:** (a) Lower threshold from 0.75 to 0.55-0.6. (b) Add question normalization: lowercase, strip punctuation, remove common stopwords ("what", "is", "the", "does", "she", "her", "how", "can", "tell", "me", "about"). (c) Add more QA pairs to `knowledge-base.json`.
**Why:** More questions answered locally = fewer Gemini calls. Stopword removal improves TF-IDF matching on short questions.
**Benefit:** Most common questions will hit local search. Gemini becomes a true fallback for edge cases only.
**Risk:** Lower threshold might cause false positives (returning wrong local answers). Test with a variety of questions.

### Phase 3: Reduce Gemini Prompt Size (P1)
**Files:** `AIAssistant.vue`, `similarity.js`
**What:** Instead of always sending the full KB as system prompt, send only the relevant category. Modify `searchKnowledgeBase()` to return the `type` of the best match (even when below threshold). Use that type to build a targeted prompt with only that section's data.
**Why:** Reduces tokens per Gemini call by ~60-70%. Reduces cost. Faster response.
**Benefit:** Each Gemini call uses ~200 tokens input instead of ~700.
**Risk:** Gemini might give less accurate answers with less context. The system prompt rules still guide it. Test accuracy.

### Phase 4: Cooldown + UX Polish (P1-P2)
**Files:** `AIAssistant.vue`
**What:** Add a 3-second cooldown between sends. Set `generationConfig` with `maxOutputTokens: 250` and `temperature: 0.7`. Add a small delay animation before the typing indicator appears.
**Why:** Prevents rapid-fire. Controls output length. Improves perceived performance.
**Benefit:** Better UX, more predictable Gemini usage.
**Risk:** Minimal.

---

## Final Verdict

**1. Is the current AI Assistant architecture good enough for a personal portfolio?**
Yes. It works, it's simple, and for low-traffic personal use it functions correctly. The Gemini free tier is generous enough that the current approach won't cause problems.

**2. Is Gemini being used efficiently?**
No. The full KB is sent on every call regardless of question type, there's no caching so identical questions create duplicate calls, and the 0.75 threshold is high enough that many reasonable questions bypass local search.

**3. What is the biggest unnecessary source of Gemini usage?**
Duplicate requests for the same question (no caching) + full KB sent on every call when only a fraction is relevant.

**4. What is the biggest security issue?**
The API key is embedded in the client-side JavaScript bundle. Anyone can extract it. For a free-tier personal project this is low-impact but technically a vulnerability.

**5. What is the simplest improvement with the biggest impact?**
Adding a response cache (a single `Map` in memory). This eliminates all duplicate Gemini calls for zero infrastructure cost and ~20 lines of code.

**6. Should we keep the current architecture or change it?**
Keep the client-side architecture but optimize it (Option B). Add caching, lower the threshold, reduce prompt size, and add a session request cap. No backend needed.

**7. What should be the NEXT implementation step?**
Phase 1: Add response caching + session request limit to `AIAssistant.vue`. This gives the biggest win for the least effort.
