<script setup>
import { useScrollReveal } from '../composables/useScrollReveal'
import { useLocale } from '../composables/useLocale.js'

useScrollReveal()

const { t, isAr } = useLocale()

const industries = [
  { en: 'Furniture & Home', ar: 'الأثاث والمنزل', enEx: 'Adrak Furniture', arEx: 'أدرك للأثاث' },
  { en: 'Marble', ar: 'الرخام', enEx: 'Afaag Marble', arEx: 'عفاغ للرخام' },
  { en: 'Pharmacy & Healthcare', ar: 'الصيدلة والرعاية الصحية', enEx: 'Rosheta Pharmacies', arEx: 'صيدليات روشيتة' },
  { en: 'Education', ar: 'التعليم', enEx: 'Smart Junior Academy', arEx: 'سمارت جونيور أكاديمي' },
  { en: 'Cleaning Services', ar: 'خدمات التنظيف', enEx: 'Alwan Happy Luck', arEx: 'ألوان هابي لوك' },
  { en: 'Beauty & E-commerce', ar: 'الجمال والتجارة الإلكترونية', enEx: 'Velora Cosmatics', arEx: 'فيلورا كوزماتكس' },
  { en: 'Social Media Projects', ar: 'مشاريع السوشيال ميديا', enEx: 'Various Brands', arEx: 'علامات متنوعة' },
]
</script>

<template>
  <section id="industries" class="industries">
    <div class="container">
      <div class="section-head industries-head fade-in">
        <span class="eyebrow">{{ t('industries.label') }}</span>
        <h2 class="section-title">{{ t('industries.title') }}</h2>
        <p class="section-subtitle">{{ t('industries.subtitle') }}</p>
      </div>

      <ul class="industry-grid fade-in">
        <li
          v-for="(industry, index) in industries"
          :key="industry.en"
          class="industry-cell"
        >
          <span class="cell-index" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="cell-name">{{ isAr ? industry.ar : industry.en }}</span>
          <span class="cell-example">{{ isAr ? industry.arEx : industry.enEx }}</span>
          <span class="cell-corner" aria-hidden="true"></span>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.industries {
  background: var(--surface);
  border-top: 1px solid var(--border);
}

.industries-head .section-subtitle {
  margin-top: 1rem;
}

.industry-grid {
  border-top: 2px solid var(--text);
  border-inline-start: 1px solid var(--border);
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}

.industry-cell {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: clamp(1.5rem, 3vw, 2.25rem);
  border-inline-end: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  transition: background-color 0.3s ease;
  overflow: hidden;
}

.industry-cell:nth-child(3n) {
  border-inline-end: none;
}

.industry-cell:hover {
  background: var(--surface-2);
}

.cell-index {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  color: var(--accent);
}

.cell-name {
  font-family: var(--font-display);
  font-size: clamp(1.1rem, 1.8vw, 1.45rem);
  font-weight: 500;
  line-height: 1.25;
  color: var(--text);
  margin-top: 0.6rem;
}

.cell-example {
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
}

[dir='rtl'] .cell-example {
  letter-spacing: 0.02em;
}

.cell-corner {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 14px;
  height: 14px;
  border-right: 2px solid var(--accent);
  border-bottom: 2px solid var(--accent);
  opacity: 0;
  transform: scale(0.6);
  transition: opacity 0.3s ease, transform 0.3s var(--ease);
}

[dir='rtl'] .cell-corner {
  right: auto;
  left: 0;
  border-right: none;
  border-left: 2px solid var(--accent);
}

.industry-cell:hover .cell-corner {
  opacity: 1;
  transform: scale(1);
}

@media (max-width: 1024px) {
  .industry-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .industry-cell:nth-child(3n) {
    border-inline-end: 1px solid var(--border);
  }

  .industry-cell:nth-child(2n) {
    border-inline-end: none;
  }
}

@media (max-width: 600px) {
  .industry-grid {
    grid-template-columns: 1fr;
  }

  .industry-cell:nth-child(2n),
  .industry-cell:nth-child(3n) {
    border-inline-end: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cell-corner {
    transition: none;
  }
}
</style>
