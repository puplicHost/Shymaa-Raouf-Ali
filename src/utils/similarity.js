function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1)
}

function termFrequency(tokens) {
  const freq = {}
  for (const token of tokens) {
    freq[token] = (freq[token] || 0) + 1
  }
  return freq
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

export function findBestMatch(query, candidates, threshold = 0.75) {
  const queryTokens = tokenize(query)
  const queryTF = termFrequency(queryTokens)

  let bestScore = 0
  let bestCandidate = null

  for (const candidate of candidates) {
    const candidateText = typeof candidate === 'string'
      ? candidate
      : candidate.question || candidate.text || ''

    const candidateTokens = tokenize(candidateText)
    const candidateTF = termFrequency(candidateTokens)
    const score = cosineSimilarity(queryTF, candidateTF)

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
