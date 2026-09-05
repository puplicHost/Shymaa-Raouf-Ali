<script setup>
import { ref, onMounted } from 'vue'
import { useLocale } from '../composables/useLocale.js'
import IconGlyph from './IconGlyph.vue'
import { ui } from '../data/icons.js'

const { t, isAr } = useLocale()
const mounted = ref(false)

onMounted(() => {
  setTimeout(() => {
    mounted.value = true
  }, 80)
})
</script>

<template>
  <section id="hero" class="hero">
    <div class="container hero-inner">
      <div class="hero-copy" :class="{ visible: mounted }">
        <div class="hero-dateline">
          <span class="dateline-item">
            {{ isAr ? 'القاهرة / الإسماعيلية · مصر — منذ ٢٠٢٥' : 'Cairo / Ismailia, Egypt — EST. 2025' }}
          </span>
          <span class="availability">
            <span class="avail-dot" aria-hidden="true"></span>
            {{ t('hero.availability') }}
          </span>
        </div>

        <h1 class="hero-title">
          {{ t('hero.title') }}
        </h1>

        <p class="hero-tagline">{{ t('hero.tagline') }}</p>

        <div class="hero-actions">
          <a href="#work" class="btn btn-ink">
            {{ t('hero.ctaWork') }}
            <IconGlyph :path="ui.arrowRight" :size="15" class="arrow" />
          </a>
          <a href="#contact" class="btn btn-ghost">{{ t('hero.ctaContact') }}</a>
        </div>
      </div>

      <div class="hero-plate" :class="{ visible: mounted }" aria-hidden="true">
        <div class="plate-frame">
          <div class="plate-top">
            <span>{{ t('hero.monogramCaption') }}</span>
            <span>{{ t('hero.monogramYear') }}</span>
          </div>
          <div class="plate-word">
            <span class="plate-init">S</span><span class="plate-accent">R</span>
          </div>
          <div class="plate-bottom">
            <span class="plate-coords">30.0444° N</span>
            <span class="plate-coords">31.2357° E</span>
          </div>
        </div>
      </div>
    </div>

    <div class="marquee">
      <div class="marquee-track">
        <div class="marquee-set">
          <span v-for="(item, i) in t('marquee')" :key="`a-${i}`" class="marquee-item">
            {{ item }}
          </span>
        </div>
        <div class="marquee-set" aria-hidden="true">
          <span v-for="(item, i) in t('marquee')" :key="`b-${i}`" class="marquee-item">
            {{ item }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  padding-block: 4.5rem 0;
}

.hero-inner {
  display: grid;
  grid-template-columns: 1.12fr 0.88fr;
  gap: clamp(2rem, 5vw, 5rem);
  align-items: center;
  padding-block: 0.5rem;
}

.hero-copy {
  opacity: 0;
  transform: translateY(26px);
  transition: opacity 1s var(--ease), transform 1s var(--ease);
}

.hero-copy.visible {
  opacity: 1;
  transform: translateY(0);
}

.hero-dateline {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  margin-bottom: 2.2rem;
}

.dateline-item {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: var(--muted);
}

[dir='rtl'] .dateline-item {
  letter-spacing: 0.03em;
}

.availability {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 0.74rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  color: var(--ink-2);
  width: fit-content;
}

.avail-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  animation: pulse 2.4s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(158, 58, 78, 0.4); }
  55% { box-shadow: 0 0 0 6px rgba(158, 58, 78, 0); }
}

.hero-title {
  font-size: clamp(2.9rem, 7.4vw, 6.1rem);
  font-weight: 500;
  line-height: 1.04;
  letter-spacing: -0.02em;
  max-width: 11ch;
  margin-bottom: 1.6rem;
}

[dir='rtl'] .hero-title {
  letter-spacing: 0;
  max-width: 100%;
}

.hero-tagline {
  font-size: clamp(1rem, 1.6vw, 1.18rem);
  font-weight: 300;
  color: var(--ink-2);
  max-width: 40ch;
  line-height: 1.85;
  margin-bottom: 2.6rem;
}

.hero-actions {
  display: flex;
  gap: 0.9rem;
  flex-wrap: wrap;
}

.hero-actions .btn-ink:hover .arrow {
  transform: translateX(4px);
}

.hero-actions .arrow {
  transition: transform 0.3s var(--ease);
}

[dir='rtl'] .hero-actions .arrow {
  transform: scaleX(-1);
}

/* Editorial cover plate ------------------------------------------------ */
.hero-plate {
  justify-self: center;
  opacity: 0;
  transform: translateY(26px);
  transition: opacity 1.1s var(--ease) 0.15s, transform 1.1s var(--ease) 0.15s;
  max-width: 320px;
  width: 100%;
}

.hero-plate.visible {
  opacity: 1;
  transform: translateY(0);
}

.plate-frame {
  position: relative;
  background: var(--paper-3);
  border: 1px solid var(--hairline-strong);
  box-shadow: 0 1px 0 rgba(34, 24, 22, 0.04);
  display: flex;
  flex-direction: column;
  padding: clamp(2rem, 4vw, 3rem);
  aspect-ratio: 4 / 4.9;
}

.plate-frame::before {
  content: '';
  position: absolute;
  inset: 12px;
  border: 1px solid var(--hairline);
  pointer-events: none;
}

.plate-frame::after {
  content: '';
  position: absolute;
  top: 0;
  inset-inline-start: 0;
  width: 64px;
  height: 3px;
  background: var(--accent);
}

.plate-top,
.plate-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--muted);
  position: relative;
  z-index: 1;
}

[dir='rtl'] .plate-top,
[dir='rtl'] .plate-bottom {
  letter-spacing: 0.03em;
}

.plate-word {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: clamp(4.5rem, 8vw, 7rem);
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.04em;
  color: var(--ink);
  position: relative;
  z-index: 1;
}

.plate-accent {
  color: var(--accent);
}

.plate-bottom {
  border-top: 1px solid var(--hairline);
  padding-top: 1.1rem;
}

[dir='rtl'] .plate-bottom {
  flex-direction: row-reverse;
}

@media (max-width: 900px) {
  .hero-inner {
    grid-template-columns: 1fr;
    gap: 3rem;
    padding-top: 3rem;
  }

  .hero-plate {
    display: none;
  }

  .hero {
    justify-content: flex-start;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-copy,
  .hero-plate {
    opacity: 1;
    transform: none;
    transition: none;
  }

  .avail-dot {
    animation: none;
  }
}
</style>