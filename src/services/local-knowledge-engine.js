import knowledgeBase from '../data/knowledge-base.json'
import {
  normalizeText,
  tokenize,
  detectLanguage,
  removeStopWords,
  preprocessQuery,
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
    rx: /(عايز اشتغل|عايز اتعاون|اتواصل مع|عايز اتواصل|كلمها|اتصال|بريد|رقم تليفون|contact|email|phone|whatsapp|reach her|get in touch|work together|linkedin|hire her)/,
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
    rx: /((ازاي|ازي).*(بتشتغل|تشغل|شغل)|(بتشتغل|تشغل|شغل).*(ازاي|ازي)|طريقه (الشغل|العمل)|بتشتغل بطريقه|منهجيه|how does she (work|approach)|how she works|how does she do (it|this|content|social)|approach|methodology|workflow|work process)/,
  },
  {
    id: 'differentiator',
    rx: /(ايه اللي بيميز|ليه اختار|بيميز|مختلفه|مميز|نقاط قوت|what makes|why choose|different|unique|stand out|sets her apart)/,
  },
  {
    id: 'contentTypes',
    rx: /(نوع المحتوى|انواع المحتوى|بتعمل محتوى|content types|type of content|content type|what content|what kind of content|make reels)/,
  },
  {
    id: 'industries',
    rx: /(مجالات|القطاعات|اشتغلت مع|فين اشتغلت|شغلت فين|اشتغلت في|industries|sectors|clients|brands|where (did|has) she work|where she work)/,
  },
  {
    id: 'identity',
    rx: /(work experience|professional background|career history|خبرتها|خبره شيماء|الخبرة المهنية)/,
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
    rx: /(مين شيماء|من هي شيماء|من شيماء|عرفني بشيماء|عرفني عن|تعرف على شيماء|هويت|who is|tell me about|introduce|what does (she|shymaa) do|about shymaa)/,
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

// ---------------------------------------------------------------------------
// Layer 2 — Fuzzy scoring (TF-IDF cosine + conservative keyword boost).
// Guards against incidental matches: a phrase only counts when it shares at
// least one NON-stopword token with the query.
// ---------------------------------------------------------------------------

function intentLists(intent, lang) {
  const k = intent.keywords || {}
  const s = intent.synonyms || {}
  const q = intent.questions || {}
  const a = intent.aliases || {}
  return {
    keywords: (k[lang] || k.en || []).map(normalizeText),
    synonyms: (s[lang] || s.en || []).map(normalizeText),
    questions: (q[lang] || q.en || []).map(normalizeText),
    aliases: (a[lang] || a.en || []).map(normalizeText),
  }
}

/**
 * Scores how strongly a candidate phrase list matches the query.
 * - Exact substring for multi-token phrases -> strong (1.0)
 * - Token overlap for shared, non-stopword tokens -> proportional
 * - Returns { match, coverage }
 */
function scoreList(normalizedQuery, queryTokens, lang, phrases) {
  if (!phrases || phrases.length === 0) return { match: 0, coverage: 0 }
  let bestMatch = 0
  let covered = new Set()

  for (const p of phrases) {
    if (!p) continue
    const pTokens = tokenize(p) // raw phrase tokens (punctuation-free, normalized)
    if (pTokens.length === 0) continue
    const pFiltered = removeStopWords(pTokens, lang).filter((t) => queryTokens.some((qt) => qt.startsWith(t) || t.startsWith(qt)))
    if (pFiltered.length === 0) continue

    // Only tokens that actually matched are "covered"; stop words inside the
    // phrase still count in the ratio ceiling so partial hits like "good" ->
    // "good at" cannot score as strongly as a real single-purpose keyword.
    pFiltered.forEach((t) => covered.add(t))

    // Multi-token exact substring phrase -> strongest signal.
    if (pTokens.length > 1 && p.length > 2 && normalizedQuery.includes(p)) {
      bestMatch = Math.max(bestMatch, 1.0)
      continue
    }

    const exactRatio = pFiltered.length / pTokens.length
    bestMatch = Math.max(bestMatch, exactRatio)
  }

  // Coverage of the query's meaningful tokens by this list.
  const coverage =
    queryTokens.length === 0 ? 1 : covered.size / queryTokens.length

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

  for (const intent of intents) {
    const { aliases, synonyms } = intentLists(intent, lang)
    const phrases = [...aliases, ...synonyms].filter(Boolean)

    for (const p of phrases) {
      const cp = normalizeText(p)
      if (!cp) continue
      // Exact or full-phrase containment.
      if (cp === normalizedQuery) {
        // Exact match always wins.
        return intent.id
      }
      // Multi-word containment only (avoids "about" hijacking a longer query).
      const multiP = cp.split(/\s+/).length > 1
      const multiQ = normalizedQuery.split(/\s+/).length > 1
      if (multiP && multiQ && (normalizedQuery.includes(cp) || cp.includes(normalizedQuery))) {
        if (cp.length > bestLen) {
          bestLen = cp.length
          best = intent.id
        }
      }
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

  // Layer 2: fuzzy ranking
  const ranked = []
  for (const intent of intents) {
    const { keywords, synonyms, questions, aliases } = intentLists(intent, lang)

    const kw = scoreList(normalizedQuery, tokens, lang, keywords)
    const sy = scoreList(normalizedQuery, tokens, lang, synonyms)
    const qu = scoreList(normalizedQuery, tokens, lang, questions)
    const al = scoreList(normalizedQuery, tokens, lang, aliases)

    // Similarity via TF-IDF over the searchable union (conservative).
    const searchable = [...synonyms, ...aliases, ...keywords, ...questions]
    const docs = searchable
      .map((s) => removeStopWords(tokenize(s), lang))
      .filter((d) => d.length > 0)
    let similarity = 0
    if (docs.length > 0) {
      const idf = buildIDF(docs)
      const queryTF = termFrequency(tokens)
      const queryVec = tfidfVector(queryTF, idf)
      for (const doc of docs) {
        const vec = tfidfVector(termFrequency(doc), idf)
        similarity = Math.max(similarity, cosineSimilarity(queryVec, vec))
      }
    }

    // Best evidence weighted by query coverage (avoids incidental keyword hits).
    // Aliases are treated as a first-class signal (same weight as synonyms).
    const bestRaw = Math.max(kw.match * 0.9, sy.match * 1.0, al.match * 1.0, qu.match * 0.8)
    const bestCoverage = Math.max(kw.coverage, sy.coverage, qu.coverage, al.coverage)
    const composite = bestRaw * (0.5 + 0.5 * bestCoverage)

    ranked.push({ intent, composite, keyword: kw.match, synonym: sy.match, question: qu.match, similarity })
  }

  ranked.sort((a, b) => {
    if (b.composite !== a.composite) return b.composite - a.composite
    return (a.intent.intentPriority || 9) - (b.intent.intentPriority || 9)
  })

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
      },
    }
  }

  return { found: false, match: null, score: top ? top.composite : 0, source: null, lang }
}

/**
 * Returns the local answer + action for a query, or null if not confident.
 */
export function findLocalAnswer(query) {
  const result = searchLocal(query)
  if (!result.found || !result.match) return null

  const answer = result.match.answer[result.lang] || result.match.answer.en || ''
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

export default { searchLocal, findLocalAnswer, detectExactIntent }