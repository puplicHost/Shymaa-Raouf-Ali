const ARABIC_STOP_WORDS = new Set([
  'في', 'من', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'ذلك', 'تلك',
  'التي', 'الذي', 'الذين', 'اللذين', 'اللتين', 'هي', 'هو', 'هم', 'هن',
  'أنا', 'نحن', 'أنت', 'أنتم', 'أنتن', 'كان', 'كانت', 'يكون', 'تكون',
  'أن', 'إن', 'لا', 'ما', 'لم', 'لن', 'هل', 'قد', 'و', 'ف', 'ب', 'ل',
  'ك', 'تم', 'لم', 'يتم', 'بت', 'بتكون', 'بيكون', 'هيكون', 'كون',
  'شيء', 'ايه', 'ازاي', 'ليه', 'كام', 'وقت', 'فين', 'حد', '.apply'
])

const ENGLISH_STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
  'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over',
  'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when',
  'where', 'why', 'how', 'all', 'both', 'each', 'few', 'more', 'most',
  'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
  'so', 'than', 'too', 'very', 'just', 'don', 'now', 'what', 'which',
  'who', 'whom', 'this', 'that', 'these', 'those', 'i', 'me', 'my',
  'myself', 'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she',
  'her', 'it', 'its', 'they', 'them', 'their', 'about', 'up'
])

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1)
}

function normalizeArabic(text) {
  return text
    .replace(/[\u0610-\u061A]/g, '')     // diacritics
    .replace(/\u0640/g, '')               // tatweel
    .replace(/[\u0622\u0623\u0625]/g, '\u0627')  // alef variants → alef
    .replace(/\u0629/g, '\u0647')         // ta marbuta → ha
    .replace(/\u0649/g, '\u064A')         // alef maqsura → ya
}

function removeStopWords(tokens, lang) {
  const stops = lang === 'ar' ? ARABIC_STOP_WORDS : ENGLISH_STOP_WORDS
  return tokens.filter((t) => !stops.has(t))
}

function termFrequency(tokens) {
  const freq = {}
  for (const token of tokens) {
    freq[token] = (freq[token] || 0) + 1
  }
  return freq
}

function buildIDF(documents) {
  const df = {}
  const N = documents.length
  for (const doc of documents) {
    const uniqueTerms = new Set(doc)
    for (const term of uniqueTerms) {
      df[term] = (df[term] || 0) + 1
    }
  }
  const idf = {}
  for (const [term, count] of Object.entries(df)) {
    idf[term] = Math.log((N + 1) / (count + 1)) + 1
  }
  return idf
}

function tfidfVector(tf, idf) {
  const vec = {}
  for (const [term, freq] of Object.entries(tf)) {
    vec[term] = freq * (idf[term] || 1)
  }
  return vec
}

function cosineSimilarity(vecA, vecB) {
  const allKeys = new Set([...Object.keys(vecA), ...Object.keys(vecB)])
  let dotProduct = 0
  let magnitudeA = 0
  let magnitudeB = 0

  for (const key of allKeys) {
    const a = vecA[key] || 0
    const b = vecB[key] || 0
    dotProduct += a * b
    magnitudeA += a * a
    magnitudeB += b * b
  }

  const magnitude = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB)
  return magnitude === 0 ? 0 : dotProduct / magnitude
}

function keywordExactMatchBoost(queryTokens, candidateKeywords) {
  if (!candidateKeywords || candidateKeywords.length === 0) return 0
  const querySet = new Set(queryTokens)
  let matches = 0
  for (const kw of candidateKeywords) {
    const kwLower = kw.toLowerCase()
    if (querySet.has(kwLower) || queryTokens.some((t) => kwLower.includes(t) || t.includes(kwLower))) {
      matches++
    }
  }
  return matches / candidateKeywords.length
}

function detectLanguage(text) {
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length
  const totalChars = text.replace(/\s/g, '').length
  if (totalChars === 0) return 'en'
  return arabicChars / totalChars > 0.3 ? 'ar' : 'en'
}

function preprocessQuery(query, lang) {
  let normalized = lang === 'ar' ? normalizeArabic(query) : query.toLowerCase()
  let tokens = tokenize(normalized)
  tokens = removeStopWords(tokens, lang)
  return tokens
}

export function findBestMatch(query, candidates, threshold = 0.5) {
  const lang = detectLanguage(query)
  const queryTokens = preprocessQuery(query, lang)

  if (queryTokens.length === 0) {
    return { score: 0, match: null, found: false }
  }

  const queryTF = termFrequency(queryTokens)

  const allCandidateDocs = candidates.map((c) => {
    const text = typeof c === 'string' ? c : c.question || c.text || ''
    const tokens = tokenize(lang === 'ar' ? normalizeArabic(text) : text.toLowerCase())
    return removeStopWords(tokens, lang)
  })

  const idf = buildIDF(allCandidateDocs)

  let bestScore = 0
  let bestCandidate = null

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i]
    const candidateTokens = allCandidateDocs[i]
    const candidateTF = termFrequency(candidateTokens)
    const vecA = tfidfVector(queryTF, idf)
    const vecB = tfidfVector(candidateTF, idf)
    let score = cosineSimilarity(vecA, vecB)

    const candidateKeywords = candidate?.keywords || []
    const boost = keywordExactMatchBoost(queryTokens, candidateKeywords)
    score = score * 0.7 + boost * 0.3

    if (score > bestScore) {
      bestScore = score
      bestCandidate = candidate
    }
  }

  return {
    score: bestScore,
    match: bestCandidate,
    found: bestScore >= threshold,
  }
}

export function searchKnowledgeBase(query, knowledgeBase) {
  if (knowledgeBase.intents) {
    return searchBilingualKB(query, knowledgeBase)
  }
  return searchLegacyKB(query, knowledgeBase)
}

function searchBilingualKB(query, knowledgeBase) {
  const lang = detectLanguage(query)
  const candidates = []

  for (const intent of knowledgeBase.intents) {
    const keywords = intent.keywords[lang] || intent.keywords.en || []
    const questions = intent.questions[lang] || intent.questions.en || []
    const searchText = [...keywords, ...questions].join(' ')

    candidates.push({
      text: `${intent.id} ${searchText}`,
      answer: intent.answer[lang] || intent.answer.en || '',
      type: intent.id,
      keywords: keywords,
    })
  }

  const result = findBestMatch(query, candidates)

  if (result.found && result.match) {
    return {
      answer: result.match.answer,
      score: result.score,
      source: result.match.type,
    }
  }

  return {
    answer: null,
    score: result.score,
    source: null,
  }
}

function searchLegacyKB(query, knowledgeBase) {
  const allTexts = []

  if (knowledgeBase.qa_pairs) {
    for (const qa of knowledgeBase.qa_pairs) {
      allTexts.push({
        text: `${qa.question} ${qa.answer}`,
        answer: qa.answer,
        type: 'qa_pair',
      })
    }
  }

  if (knowledgeBase.skills) {
    allTexts.push({
      text: `skills ${knowledgeBase.skills.join(' ')}`,
      answer: `Shymaa's skills include: ${knowledgeBase.skills.join(', ')}.`,
      type: 'skills',
    })
  }

  if (knowledgeBase.experience) {
    const expText = `${knowledgeBase.experience.current_role} ${knowledgeBase.experience.responsibilities.join(' ')}`
    allTexts.push({
      text: `experience ${expText}`,
      answer: `Shymaa has ${knowledgeBase.experience.years} years of experience. She currently works as ${knowledgeBase.experience.current_role} since ${knowledgeBase.experience.start_date}. Her responsibilities include: ${knowledgeBase.experience.responsibilities.join('; ')}.`,
      type: 'experience',
    })
  }

  if (knowledgeBase.education) {
    const edu = knowledgeBase.education
    allTexts.push({
      text: `education ${edu.degree} ${edu.university} ${edu.year} ${edu.grade}`,
      answer: `Shymaa holds a ${edu.degree} from ${edu.university} (${edu.year}), graduating with ${edu.grade} honors.`,
      type: 'education',
    })
  }

  if (knowledgeBase.certifications) {
    allTexts.push({
      text: `certifications ${knowledgeBase.certifications.join(' ')}`,
      answer: `Shymaa holds the following certifications: ${knowledgeBase.certifications.join(', ')}.`,
      type: 'certifications',
    })
  }

  if (knowledgeBase.industries) {
    allTexts.push({
      text: `industries ${knowledgeBase.industries.join(' ')}`,
      answer: `Shymaa has worked across these industries: ${knowledgeBase.industries.join(', ')}.`,
      type: 'industries',
    })
  }

  if (knowledgeBase.projects) {
    const projectTexts = knowledgeBase.projects.map((p) => `${p.name} ${p.industry}`).join(' ')
    allTexts.push({
      text: `projects ${projectTexts}`,
      answer: `Shymaa has managed projects including: ${knowledgeBase.projects.map((p) => `${p.name} (${p.industry})`).join(', ')}.`,
      type: 'projects',
    })
  }

  if (knowledgeBase.identity) {
    const id = knowledgeBase.identity
    allTexts.push({
      text: `identity name ${id.name} title ${id.title} location ${id.location} languages ${id.languages.join(' ')}`,
      answer: `${id.name} is a ${id.title} based in ${id.location}, focused on the ${id.focus}. She speaks ${id.languages.join(', ')}.`,
      type: 'identity',
    })
  }

  if (knowledgeBase.what_makes_her_different) {
    allTexts.push({
      text: `different unique why choose ${knowledgeBase.what_makes_her_different}`,
      answer: `What makes Shymaa different: ${knowledgeBase.what_makes_her_different}`,
      type: 'differentiator',
    })
  }

  if (knowledgeBase.approach) {
    allTexts.push({
      text: `approach process how works ${knowledgeBase.approach.join(' ')}`,
      answer: `Shymaa's approach: ${knowledgeBase.approach.join('. ')}.`,
      type: 'approach',
    })
  }

  const result = findBestMatch(query, allTexts)

  if (result.found && result.match) {
    return {
      answer: result.match.answer,
      score: result.score,
      source: result.match.type,
    }
  }

  return {
    answer: null,
    score: result.score,
    source: null,
  }
}
