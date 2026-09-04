const stats = {
  totalQueries: 0,
  localHits: 0,
  geminiFallbacks: 0,
  intentDistribution: {},
  languageDistribution: { ar: 0, en: 0 },
  scores: [],
  errors: 0,
}

export function trackQuery(source, score, lang) {
  stats.totalQueries++
  stats.scores.push(score)
  if (stats.scores.length > 100) stats.scores.shift()

  if (source && source !== 'gemini') {
    stats.localHits++
    stats.intentDistribution[source] = (stats.intentDistribution[source] || 0) + 1
  } else {
    stats.geminiFallbacks++
  }

  if (lang) {
    stats.languageDistribution[lang] = (stats.languageDistribution[lang] || 0) + 1
  }
}

export function trackError() {
  stats.errors++
}

export function getStats() {
  const avgScore = stats.scores.length > 0
    ? (stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length).toFixed(3)
    : 0
  const hitRate = stats.totalQueries > 0
    ? ((stats.localHits / stats.totalQueries) * 100).toFixed(1)
    : 0

  return {
    total: stats.totalQueries,
    localHits: stats.localHits,
    geminiFallbacks: stats.geminiFallbacks,
    hitRate: `${hitRate}%`,
    avgScore,
    intents: { ...stats.intentDistribution },
    languages: { ...stats.languageDistribution },
    errors: stats.errors,
  }
}

export function logStats() {
  const s = getStats()
  console.group('%c🤖 AI Assistant Stats', 'color: #C4A8B0; font-weight: bold;')
  console.log(`Total queries: ${s.total}`)
  console.log(`Local hits: ${s.localHits} (${s.hitRate})`)
  console.log(`Gemini fallbacks: ${s.geminiFallbacks}`)
  console.log(`Average score: ${s.avgScore}`)
  console.log(`Errors: ${s.errors}`)
  console.log('Intent distribution:', s.intents)
  console.log('Language distribution:', s.languages)
  console.groupEnd()
}
