import { describe, it } from 'vitest'
import { searchLocal } from '../src/services/local-knowledge-engine.js'

// Informational performance benchmark (no assertions on timing).
// Full methodology + before/after numbers live in the implementation report.
// Run alone: npx vitest run tests/benchmark.test.js
describe('benchmark (informational)', () => {
  it('logs per-category latency', () => {
    const cats = {
      exact_theme: ['مين هي شيماء؟', 'وريني مشاريعها', 'What are her skills?'],
      concept: ['about', 'who is she'],
      fuzzy_ar: ['عايز أعرف خبرة شيماء في الأثاث', 'شيماء تشتغل في البنوك؟'],
      fuzzy_eg: ['عايزة أعرف مهارات شيماء', 'طب قولي طريقة شغل شيماء'],
      fuzzy_gulf: ['شنو أنواع المحتوى اللي تسويها شيماء؟', 'أبغى أعرف شهادات شيماء'],
      fuzzy_en: ['Is Shymaa good for a furniture brand?', 'Does Shymaa hold a Google certificate?'],
    }
    for (const [name, qs] of Object.entries(cats)) {
      const ts = []
      for (let i = 0; i < 10; i++) {
        for (const q of qs) {
          const t0 = performance.now()
          const r = searchLocal(q)
          ts.push(performance.now() - t0)
          if (!r) throw new Error('no result')
        }
      }
      ts.sort((a, b) => a - b)
      const avg = ts.reduce((a, b) => a + b, 0) / ts.length
      console.log(`BENCH|${name}|n=${ts.length}|avg=${avg.toFixed(2)}|p95=${ts[Math.floor(ts.length * 0.95)].toFixed(2)}`)
    }
  })
})
