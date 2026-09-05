<script setup>
import { ref } from 'vue'
import { useScrollReveal } from '../composables/useScrollReveal'
import { useLocale } from '../composables/useLocale.js'
import IconGlyph from './IconGlyph.vue'
import { ui } from '../data/icons.js'

useScrollReveal()

const { t, isAr } = useLocale()

const certifications = [
  { en: 'Google AI Professional Certificate', ar: 'شهادة جوجل للمحترفين في الذكاء الاصطناعي', enIssuer: 'Google', arIssuer: 'جوجل' },
  { en: 'Generative AI for Digital Marketing', ar: 'تخصص الذكاء الاصطناعي التوليدي للتسويق الرقمي', enIssuer: 'Coursera', arIssuer: 'كورسيرا' },
  { en: 'AI Content Mastery for Social Media', ar: 'إتقان المحتوى بالذكاء الاصطناعي للسوشيال ميديا', enIssuer: 'Industry Certification', arIssuer: 'شهادة صناعية' },
  { en: 'Meta Social Media Marketing Professional', ar: 'شهادة ميتا المتخصصة في إدارة وسائل التواصل', enIssuer: 'Meta', arIssuer: 'ميتا' },
  { en: 'Google Digital Marketing & E-commerce', ar: 'شهادة جوجل في التسويق الرقمي والتجارة الإلكترونية', enIssuer: 'Google', arIssuer: 'جوجل' },
  { en: 'HubSpot Content Marketing Certification', ar: 'شهادة هب سبوت في تسويق المحتوى', enIssuer: 'HubSpot', arIssuer: 'هب سبوت' },
  { en: 'DELF B1 — French Language', ar: 'شهادة DELF B1 في اللغة الفرنسية', enIssuer: 'France Éducation', arIssuer: 'فرنسا للتعليم' },
]

const track = ref(null)

function step(direction) {
  const el = track.value
  if (!el) return
  el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: 'smooth' })
}
</script>

<template>
  <section id="certifications" class="certifications">
    <div class="container">
      <div class="section-head certs-head fade-in">
        <span class="eyebrow">{{ t('certs.label') }}</span>
        <div class="certs-head-row">
          <div>
            <h2 class="section-title">{{ t('certs.title') }}</h2>
            <p class="section-subtitle">{{ t('certs.subtitle') }}</p>
          </div>
          <div class="certs-controls">
            <button type="button" class="ctrl-btn" :aria-label="`${t('certs.label')} —`" @click="step(-1)">
              <IconGlyph :path="isAr ? ui.chevronRight : ui.chevronLeft" :size="18" />
            </button>
            <button type="button" class="ctrl-btn" :aria-label="`${t('certs.label')} +`" @click="step(1)">
              <IconGlyph :path="isAr ? ui.chevronLeft : ui.chevronRight" :size="18" />
            </button>
          </div>
        </div>
      </div>

      <div class="certs-scroll fade-in" ref="track">
        <article
          v-for="(cert, index) in certifications"
          :key="cert.en"
          class="cert-card"
        >
          <span class="cert-no" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
          <div class="cert-meta">
            <h3 class="cert-name">{{ isAr ? cert.ar : cert.en }}</h3>
            <span class="cert-issuer">{{ isAr ? cert.arIssuer : cert.enIssuer }}</span>
          </div>
          <IconGlyph :path="ui.starFourPoints" :size="16" class="cert-glyph" aria-hidden="true" />
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.certifications {
  background: var(--paper);
  border-top: 1px solid var(--hairline);
}

.certs-head-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 2rem;
}

.certs-head .section-subtitle {
  margin-top: 1rem;
}

.certs-controls {
  display: flex;
  gap: 0.6rem;
  flex-shrink: 0;
}

.ctrl-btn {
  width: 46px;
  height: 46px;
  border: 1px solid var(--hairline-strong);
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ink);
  transition: background-color 0.25s ease, color 0.25s ease,
    border-color 0.25s ease, transform 0.25s var(--ease);
}

.ctrl-btn:hover {
  background: var(--ink);
  border-color: var(--ink);
  color: var(--on-ink);
  transform: translateY(-2px);
}

.certs-scroll {
  display: flex;
  gap: 1.25rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  padding-bottom: 0.5rem;
  -webkit-overflow-scrolling: touch;
}

.certs-scroll::-webkit-scrollbar {
  display: none;
}

.cert-card {
  position: relative;
  flex: 0 0 auto;
  scroll-snap-align: start;
  width: min(360px, 84vw);
  background: var(--paper-3);
  border: 1px solid var(--hairline);
  padding: clamp(1.6rem, 3vw, 2.2rem);
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
  transition: border-color 0.3s ease, transform 0.3s var(--ease);
}

.cert-card:hover {
  border-color: var(--accent);
  transform: translateY(-3px);
}

.cert-no {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  color: var(--accent);
}

.cert-name {
  font-size: 1.12rem;
  font-weight: 500;
  line-height: 1.4;
  color: var(--ink);
}

.cert-issuer {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  margin-top: 0.55rem;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
  border-inline-start: 2px solid var(--accent);
  padding-inline-start: 0.7rem;
}

[dir='rtl'] .cert-issuer {
  letter-spacing: 0.02em;
}

.cert-glyph {
  position: absolute;
  top: 1.6rem;
  inset-inline-end: 1.8rem;
  color: var(--accent);
  opacity: 0.4;
}

@media (max-width: 640px) {
  .certs-head-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .cert-card {
    width: min(300px, 82vw);
  }
}

@media (prefers-reduced-motion: reduce) {
  .cert-card,
  .ctrl-btn {
    transition: none;
  }

  .cert-card:hover {
    transform: none;
  }
}
</style>