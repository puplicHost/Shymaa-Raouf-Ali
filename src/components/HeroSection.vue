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
            {{ isAr ? 'الإسماعيلية · مصر — منذ ٢٠٢٥' : 'Ismailia, Egypt — EST. 2025' }}
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
    </div>
  </section>
</template>

<style scoped>
.hero {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-block: 4.5rem 0;
}

.hero-inner {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
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
  font-size: clamp(3.2rem, 8vw, 6.5rem);
  font-weight: 500;
  line-height: 1.04;
  letter-spacing: -0.02em;
  max-width: 12ch;
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
  max-width: 44ch;
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

@media (prefers-reduced-motion: reduce) {
  .hero-copy {
    opacity: 1;
    transform: none;
    transition: none;
  }

  .avail-dot {
    animation: none;
  }
}
</style>
