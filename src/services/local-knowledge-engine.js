import knowledgeBase from '../data/knowledge-base.json'
import {
  normalizeText,
  tokenize,
  detectLanguage,
  removeStopWords,
  preprocessQuery,
  stripDefiniteArticle,
  tokensEquivalent,
} from './text-utils.js'

const intents = knowledgeBase.intents || []

// ---------------------------------------------------------------------------
// Layer 1 — High-precision exact intent detection.
// A small ordered set of distinctive phrase rules (in normalized form).
// Gives deterministic, confident matching for the classic portfolio queries,
// so the fuzzy layer only handles paraphrase leftovers.
// ---------------------------------------------------------------------------

// NOTE: rules operate on `normalizeText()` output (lowercased; alef variants,
// ta marbuta and alef maqsura folded). Order matters — more specific rules
// are checked first.
const THEME_RULES = [
  {
    id: 'contact',
    rx: /(عايز اشتغل|عايز اتعاون|اتواصل مع|عايز اتواصل|ابغي اتواصل|ابي اتواصل|ابغي اشتغل|ابي اشتغل|كلمها|اتصال|بريد|رقم تليفون|contact|email|phone|whatsapp|reach her|get in touch|work together|linkedin|hire her)/,
  },
  {
    id: 'availability',
    rx: /(متاحه|متاح|شاغره|شاغر|فرصه عمل|بتدور على شغل|available|open to work|looking for|freelance|vacant|hiring)/,
  },
  {
    id: 'skills',
    rx: /(مهارات|مهاره|بتعرف تعمل|قادره على|skills|abilities|competenc|good at|can she do|strongest)/,
  },
  {
    id: 'approach',
    rx: /((ازاي|ازي).*(بتشتغل|تشغل|شغل)|(بتشتغل|تشغل|شغل).*(ازاي|ازي)|(كيف|شلون).*(بتشتغل|تشتغل|تشغل|شغل)|(بتشتغل|تشتغل|تشغل|شغل).*(كيف|شلون)|طريقه (الشغل|العمل)|بتشتغل بطريقه|منهجيه|how does she (work|approach)|how she works|how does she do (it|this|content|social)|approach|methodology|workflow|work process)/,
  },
  {
    id: 'differentiator',
    rx: /(ايه اللي بيميز|ليه اختار|بيميز|مختلفه|مميز|نقاط قوت|what makes|why choose|different|unique|stand out|sets her apart)/,
  },
  {
    id: 'contentTypes',
    rx: /(نوع المحتوى|انواع المحتوى|بتعمل محتوى|شنو المحتوي|وش المحتوي|content types|type of content|content type|what content|what kind of content|make reels)/,
  },
  {
    id: 'industries',
    rx: /(مجالات|القطاعات|اشتغلت مع|فين اشتغلت|شغلت فين|وين اشتغلت|تشتغل وين|اشتغلت في|industries|sectors|clients|brands|where (did|has) she work|where she work)/,
  },
  {
    id: 'identity',
    rx: /(work experience|professional background|career history|خبرتها|الخبرة المهنية)/,
  },
  {
    id: 'projects',
    rx: /(مشاريع|(?:^|[^\p{L}\p{N}])شغل(?=$|[^\p{L}\p{N}])|وريني|شوف شغلها|شغلها|\bwork\b|projects|portfolio|selected work|show me (her|shymaa|the)|her work|explore (her|the|shymaa))/,
  },
  {
    id: 'education',
    rx: /(تعليم|تعلم|التعلم|education|learning)/,
  },
  {
    id: 'caseStudies',
    rx: /(دراسات|دراسه حاله|case stud|نتايج|نتائج|project details)/,
  },
  {
    id: 'identity',
    rx: /(مين شيماء|من هي شيماء|من شيماء|منو شيماء|منو هي|شنو تشتغل|وش تشتغل|عرفني بشيماء|عرفني عن|تعرف على شيماء|هويت|who is|tell me about|introduce|what does (she|shymaa) do|about shymaa)/,
  },
]

export function detectExactIntent(normalizedQuery) {
  if (!normalizedQuery) return null
  for (const rule of THEME_RULES) {
    if (rule.rx.test(normalizedQuery)) return rule.id
  }
  return null
}

// ---------------------------------------------------------------------------
// Term-frequency / IDF helpers (small, self-contained)
// ---------------------------------------------------------------------------

function termFrequency(tokens) {
  const freq = {}
  for (const token of tokens) freq[token] = (freq[token] || 0) + 1
  return freq
}

function buildIDF(documents) {
  const df = {}
  const N = documents.length
  for (const doc of documents) {
    for (const term of new Set(doc)) df[term] = (df[term] || 0) + 1
  }
  const idf = {}
  for (const [term, count] of Object.entries(df)) {
    idf[term] = Math.log((N + 1) / (count + 1)) + 1
  }
  return idf
}

function tfidfVector(tf, idf) {
  const vec = {}
  for (const [term, freq] of Object.entries(tf)) vec[term] = freq * (idf[term] || 1)
  return vec
}

function cosineSimilarity(vecA, vecB) {
  const keys = new Set([...Object.keys(vecA), ...Object.keys(vecB)])
  let dot = 0
  let magA = 0
  let magB = 0
  for (const key of keys) {
    const a = vecA[key] || 0
    const b = vecB[key] || 0
    dot += a * b
    magA += a * a
    magB += b * b
  }
  const mag = Math.sqrt(magA) * Math.sqrt(magB)
  return mag === 0 ? 0 : dot / mag
}

/**
 * Jaccard similarity between the query token set and each intent phrase.
 * Returns the best score (0..1) across all phrases. Longer queries sharing
 * many tokens with an intent get a confidence boost via `composite`.
 *
 * Single-token queries are excluded (return 0): a lone generic word like
 * "good" would otherwise score a perfect 1.0 against a short phrase such as
 * "good at" and gain unearned confidence. The boost targets long questions.
 */
export function jaccardMatch(queryTokens, intentPhrases, lang = 'ar') {
  const qSet = new Set((queryTokens || []).map(stripDefiniteArticle))
  if (qSet.size < 2 || !intentPhrases || intentPhrases.length === 0) return 0
  let best = 0
  for (const phrase of intentPhrases) {
    if (!phrase) continue
    const pTokens = removeStopWords(tokenize(phrase), lang).map(stripDefiniteArticle)
    if (pTokens.length === 0) continue
    const pSet = new Set(pTokens)
    let inter = 0
    for (const t of pSet) if (qSet.has(t)) inter++
    if (inter === 0) continue
    const union = new Set([...qSet, ...pSet]).size
    const score = union === 0 ? 0 : inter / union
    if (score > best) best = score
  }
  return best
}

// ---------------------------------------------------------------------------
// Layer 2 — Fuzzy scoring (TF-IDF cosine + conservative keyword boost).
// Guards against incidental matches: a phrase only counts when it shares at
// least one NON-stopword token with the query.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Precomputed retrieval index (built ONCE at module load).
// Previously every query re-normalized ~5000 phrases, re-tokenized them, and
// rebuilt TF-IDF structures per intent. Now all static work happens here:
// normalized + tokenized phrase lists, TF-IDF idf/doc vectors, and an
// inverted token -> intent index for candidate filtering. Per-query work is
// normalization of the query itself plus scoring of candidate intents only.
// ---------------------------------------------------------------------------

function precomputePhrases(rawList) {
  const out = []
  for (const raw of rawList || []) {
    const t = normalizeText(raw)
    if (!t) continue
    // tok mirrors the old per-query `tokenize(normalizedPhrase)` exactly.
    out.push({ t, tok: tokenize(t) })
  }
  return out
}

function buildIntentRecord(intent) {
  const rec = { intent, byLang: {} }
  for (const lang of ['ar', 'en']) {
    const k = intent.keywords || {}
    const s = intent.synonyms || {}
    const q = intent.questions || {}
    const a = intent.aliases || {}
    // lang 'ar' covers MSA + Egyptian + Gulf lists (detectLanguage only yields ar/en).
    const pick = (o) =>
      lang === 'ar'
        ? [...(o.ar || []), ...(o['ar-eg'] || []), ...(o['ar-gulf'] || [])]
        : o[lang] || o.en || []
    const L = {
      keywords: precomputePhrases(pick(k)),
      synonyms: precomputePhrases(pick(s)),
      questions: precomputePhrases(pick(q)),
      aliases: precomputePhrases(a[lang] || a.en || []),
    }
    // TF-IDF documents over the searchable union, in the same order as before.
    const docs = [...L.synonyms, ...L.aliases, ...L.keywords, ...L.questions]
      .map((e) => removeStopWords(e.tok, lang))
      .filter((d) => d.length > 0)
    L.idf = buildIDF(docs)
    L.docVecs = docs.map((d) => tfidfVector(termFrequency(d), L.idf))
    rec.byLang[lang] = L
  }
  return rec
}

const RECORDS = intents.map(buildIntentRecord)

// Inverted index: non-stopword token -> intent record indices, per language.
// A query token hits a key on the same prefix rule the scorer uses, so any
// intent that could score above zero is always retrieved (superset filter).
function buildTokenIndex(lang) {
  const idx = new Map()
  const addKey = (key, i) => {
    let s = idx.get(key)
    if (!s) {
      s = new Set()
      idx.set(key, s)
    }
    s.add(i)
  }
  for (let i = 0; i < RECORDS.length; i++) {
    const L = RECORDS[i].byLang[lang]
    for (const list of [L.keywords, L.synonyms, L.questions, L.aliases]) {
      for (const e of list) {
        for (const t of removeStopWords(e.tok, lang)) {
          addKey(t, i)
          // Canonical form too, so البنوك finds بنوك-indexed intents and back.
          const c = stripDefiniteArticle(t)
          if (c !== t) addKey(c, i)
        }
      }
    }
  }
  return idx
}

const TOKEN_INDEX = { ar: buildTokenIndex('ar'), en: buildTokenIndex('en') }

function candidateIntents(lang, queryTokens) {
  const out = new Set()
  const index = TOKEN_INDEX[lang]
  if (!index || queryTokens.length === 0) return out
  for (const q of queryTokens) {
    for (const [key, ids] of index) {
      if (tokensEquivalent(key, q)) {
        for (const id of ids) out.add(id)
      }
    }
  }
  return out
}

/**
 * Scores how strongly a candidate phrase list matches the query.
 * - Exact substring for multi-token phrases -> strong (1.0)
 * - Token overlap for shared, non-stopword tokens -> proportional
 * - Returns { match, coverage }
 * Takes precomputed { t, tok } entries (identical math to the old version,
 * without re-tokenizing phrases on every query).
 */
function scoreList(normalizedQuery, queryTokens, lang, cached) {
  if (!cached || cached.length === 0) return { match: 0, coverage: 0 }
  let bestMatch = 0
  let covered = new Set()
  // Trailing punctuation (؟ ? ! .) must not break exact-phrase matching:
  // "فين اشتغلت" and "فين اشتغلت؟" are the same question.
  const cleanQuery = normalizedQuery.replace(/[؟?!.,،;:\s]+$/u, '')

  for (const { t: p, tok: pTokens } of cached) {
    if (pTokens.length === 0) continue
    const pFiltered = removeStopWords(pTokens, lang).filter((t) => queryTokens.some((qt) => tokensEquivalent(qt, t)))
    if (pFiltered.length === 0) continue

    // Only tokens that actually matched are "covered"; stop words inside the
    // phrase still count in the ratio ceiling so partial hits like "good" ->
    // "good at" cannot score as strongly as a real single-purpose keyword.
    pFiltered.forEach((t) => covered.add(t))

    // Multi-token exact substring phrase -> strongest signal.
    // Compared punctuation-insensitively so a stored "…؟" still matches a
    // query typed without it (and vice versa).
    const cleanPhrase = p.replace(/[؟?!.,،;:\s]+$/u, '')
    if (pTokens.length > 1 && cleanPhrase.length > 2 && cleanQuery.includes(cleanPhrase)) {
      bestMatch = Math.max(bestMatch, 1.0)
      continue
    }

    const exactRatio = pFiltered.length / pTokens.length
    bestMatch = Math.max(bestMatch, exactRatio)
  }

  // Coverage of the query's meaningful tokens by this list, capped at 1:
  // with a large knowledge base many phrases can collectively "cover" more
  // distinct tokens than a short query holds, which must not inflate confidence.
  const coverage =
    queryTokens.length === 0 ? 1 : Math.min(1, covered.size / queryTokens.length)

  return { match: bestMatch, coverage }
}

/**
 * Intent Concept Layer: resolves a short, unambiguous user concept to its
 * matching intent using the KB's own alias/synonym phrases. Operates on the
 * normalized query (before stop-word removal), so concepts that are entirely
 * stop words — "about", "who is she", "work experience" — still resolve.
 *
 * Conservative by design: only exact matches, or multi-word phrase containment
 * where neither side is a mere single generic token, are accepted. Weak or
 * ambiguous input returns null so the theme/fuzzy layers or fallback handle it.
 */
function matchConceptIntent(normalizedQuery, lang) {
  if (!normalizedQuery) return null
  let best = null
  let bestLen = 0

  for (const rec of RECORDS) {
    const L = rec.byLang[lang]
    const phrases = [...L.aliases, ...L.synonyms]

    for (const e of phrases) {
      const cp = e.t
      if (!cp) continue
      // Exact or full-phrase containment.
      if (cp === normalizedQuery) {
        // Exact match always wins.
        return rec.intent.id
      }
      // Multi-word containment only (avoids "about" hijacking a longer query).
      const multiP = cp.split(/\s+/).length > 1
      const multiQ = normalizedQuery.split(/\s+/).length > 1
      if (multiP && multiQ && (normalizedQuery.includes(cp) || cp.includes(normalizedQuery))) {
        if (cp.length > bestLen) {
          bestLen = cp.length
          best = rec.intent.id
        }
      }
    }
  }
  return best
}

/**
 * Cached variant of jaccardMatch over precomputed phrase entries.
 * Same math (exact token-set Jaccard, single-token queries excluded).
 */
function jaccardCached(qSet, cachedLists, lang) {
  if (qSet.size < 2) return 0
  const qCanon = new Set([...qSet].map(stripDefiniteArticle))
  if (qCanon.size < 2) return 0
  let best = 0
  for (const list of cachedLists) {
    for (const e of list) {
      const pTokens = removeStopWords(e.tok, lang).map(stripDefiniteArticle)
      if (pTokens.length === 0) continue
      const pSet = new Set(pTokens)
      let inter = 0
      for (const t of pSet) if (qSet.has(t)) inter++
      if (inter === 0) continue
      const union = new Set([...qSet, ...pSet]).size
      const score = union === 0 ? 0 : inter / union
      if (score > best) best = score
    }
  }
  return best
}

/**
 * Searches the structured, bilingual knowledge base.
 * Returns the highest-confidence intent with a deterministic ranking:
 *   intent concept  >  exact intent theme  >  phrase  >  keyword  >  synonym  >  similarity
 *
 * Layer 0 (concept) runs on the normalized query itself, so short concept
 * phrases that collapse to stop words (e.g. "about", "who is she", "work
 * experience") still resolve. It only fires on strong matches — never on weak
 * or ambiguous input — so unknown/phrases fall through to the fuzzy layers.
 */
export function searchLocal(query) {
  const { lang, tokens } = preprocessQuery(query)
  const normalizedQuery = normalizeText(query)

  // Layer 0: Intent Concept Layer. Runs only when the query lost ALL its
  // meaningful tokens to stop-word removal (e.g. "about", "who is she",
  // "what does she do"), because those would otherwise hit the early return
  // below before the theme/fuzzy layers get a chance. When the query retains
  // tokens, the theme/fuzzy layers handle it — we never let a bare alias
  // hijack a token-bearing query into the wrong intent.
  const conceptId = tokens.length === 0 ? matchConceptIntent(normalizedQuery, lang) : null
  if (conceptId) {
    const intent = intents.find((i) => i.id === conceptId)
    if (intent) return { found: true, match: intent, score: 0.95, source: intent.id, lang, fromConcept: true }
  }

  if (tokens.length === 0) {
    return { found: false, match: null, score: 0, source: null, lang }
  }

  // Layer 1: exact intent theme
  const themeIntent = detectExactIntent(normalizedQuery)
  if (themeIntent) {
    const intent = intents.find((i) => i.id === themeIntent)
    if (intent) return { found: true, match: intent, score: 1.0, source: intent.id, lang }
  }

  // Layer 2: fuzzy ranking over candidate intents only. The inverted index
  // is a proven superset filter (any intent able to score above zero shares a
  // prefix-overlapping non-stopword token with the query), so skipped intents
  // would all score exactly 0 and can never win.
  const qSet = new Set(tokens)
  const queryTF = termFrequency(tokens)
  const ranked = []
  for (const i of candidateIntents(lang, tokens)) {
    const rec = RECORDS[i]
    const intent = rec.intent
    const { keywords, synonyms, questions, aliases } = rec.byLang[lang]

    const kw = scoreList(normalizedQuery, tokens, lang, keywords)
    const sy = scoreList(normalizedQuery, tokens, lang, synonyms)
    const qu = scoreList(normalizedQuery, tokens, lang, questions)
    const al = scoreList(normalizedQuery, tokens, lang, aliases)

    // Similarity via TF-IDF with precomputed idf/doc vectors (same math).
    const L = rec.byLang[lang]
    let similarity = 0
    if (L.docVecs.length > 0) {
      const queryVec = tfidfVector(queryTF, L.idf)
      for (const vec of L.docVecs) {
        similarity = Math.max(similarity, cosineSimilarity(queryVec, vec))
      }
    }

    // Best evidence weighted by query coverage (avoids incidental keyword hits).
    // Aliases are treated as a first-class signal (same weight as synonyms).
    // An exact full-question match is the strongest possible evidence, so it
    // is not discounted like partial question overlap is.
    const quScore = qu.match >= 1 ? 1.0 : qu.match * 0.8
    const bestRaw = Math.max(kw.match * 0.9, sy.match * 1.0, al.match * 1.0, quScore)
    const bestCoverage = Math.max(kw.coverage, sy.coverage, qu.coverage, al.coverage)
    const jaccard = jaccardCached(qSet, [keywords, synonyms, aliases], lang)
    const composite = (bestRaw * (0.5 + 0.5 * bestCoverage)) + (jaccard * 0.3)

    ranked.push({ intent, composite, keyword: kw.match, synonym: sy.match, question: qu.match, similarity, jaccard })
  }

  if (ranked.length === 0) {
    return { found: false, match: null, score: 0, source: null, lang }
  }

  ranked.sort((a, b) => {
    if (b.composite !== a.composite) return b.composite - a.composite
    return (a.intent.intentPriority || 9) - (b.intent.intentPriority || 9)
  })

  // Guard against `identity` dominating long, non-introductory questions:
  // identity aliases ("شيماء", "she", "work experience") appear inside many
  // queries, so when the top intent is identity on a multi-token query and the
  // runner-up is close behind, demote identity and re-rank.
  if (ranked.length > 1 && ranked[0].intent.id === 'identity' && tokens.length >= 3) {
    const gap = ranked[0].composite - ranked[1].composite
    if (gap < 0.3) {
      ranked[0].composite -= 0.2
      ranked.sort((a, b) => {
        if (b.composite !== a.composite) return b.composite - a.composite
        return (a.intent.intentPriority || 9) - (b.intent.intentPriority || 9)
      })
    }
  }

  const top = ranked[0]
  const THRESHOLD = 0.45
  if (top && top.composite >= THRESHOLD) {
    return {
      found: true,
      match: top.intent,
      score: top.composite,
      source: top.intent.id,
      lang,
      breakdown: {
        keyword: top.keyword,
        synonym: top.synonym,
        question: top.question,
        similarity: top.similarity,
        jaccard: top.jaccard,
      },
    }
  }

  return { found: false, match: null, score: top ? top.composite : 0, source: null, lang }
}

/**
 * Session-level guard against repeating the exact same answer variation twice
 * in a row. Reset alongside the rate limit so every test starts clean.
 */
let lastReply = null

export function resetLastReply() {
  lastReply = null
}

/**
 * Picks one variation from an intent's `answers` pool (random, never repeating
 * the immediately-previous reply when alternatives exist). Falls back to the
 * legacy single `answer` field when no variations are defined.
 */
export function pickAnswerVariation(intent, lang) {
  const pool = intent.answers?.[lang] || intent.answers?.en || null
  const fallback = intent.answer?.[lang] || intent.answer?.en || ''
  const answers = pool && pool.length > 0 ? pool : [fallback]
  let selected = answers[Math.floor(Math.random() * answers.length)]
  if (answers.length > 1 && selected === lastReply) {
    const others = answers.filter((a) => a !== selected)
    selected = others[Math.floor(Math.random() * others.length)]
  }
  lastReply = selected
  return selected
}

/**
 * Returns the local answer + action for a query, or null if not confident.
 */
export function findLocalAnswer(query) {
  const result = searchLocal(query)
  if (!result.found || !result.match) return null

  const answer = pickAnswerVariation(result.match, result.lang)
  return {
    answer,
    intentId: result.match.id,
    category: result.match.category,
    action: result.match.action || null,
    score: result.score,
    lang: result.lang,
    source: 'local',
  }
}

export default { searchLocal, findLocalAnswer, detectExactIntent, jaccardMatch, pickAnswerVariation, resetLastReply }