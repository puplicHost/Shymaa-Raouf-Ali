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
    <div class="hero-inner">
      <!-- Left: main editorial content -->
      <div class="hero-content" :class="{ visible: mounted }">
        <div class="hero-meta">
          <span class="meta-line">
            {{ isAr ? 'الإسماعيلية، مصر' : 'Ismailia, Egypt' }}
          </span>
          <span class="meta-sep" aria-hidden="true">—</span>
          <span class="meta-line">EST. 2025</span>
        </div>

        <div class="hero-name">
          <span class="name-first">{{ t('hero.firstName') }}</span>
          <span class="name-second">{{ t('hero.lastName') }}</span>
        </div>

        <div class="hero-bottom">
          <div class="hero-bottom-left">
            <p class="hero-tagline">{{ t('hero.tagline') }}</p>

            <div class="hero-actions">
              <a href="#work" class="btn btn-ink">
                {{ t('hero.ctaWork') }}
                <IconGlyph :path="ui.arrowRight" :size="15" class="arrow" />
              </a>
              <a href="#contact" class="btn btn-ghost">{{ t('hero.ctaContact') }}</a>
            </div>
          </div>

          <div class="hero-availability">
            <span class="avail-dot" aria-hidden="true"></span>
            {{ t('hero.availability') }}
          </div>
        </div>
      </div>

      <!-- Right: editorial decorative composition -->
      <div class="hero-deco" :class="{ visible: mounted }" aria-hidden="true">
        <div class="deco-line"></div>
        <div class="deco-text">
          <span>SOCIAL</span>
          <span>CONTENT</span>
        </div>
        <div class="deco-label">
          <span class="deco-label-text">{{ isAr ? 'مصممة محتوى' : 'Content Designer' }}</span>
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
  padding-block: 5rem 2rem;
  overflow: hidden;
}

.hero-inner {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: clamp(2rem, 5vw, 6rem);
  align-items: center;
  max-width: var(--max-width);
  margin-inline: auto;
  padding-inline: var(--gutter);
  width: 100%;
}

/* ── Left: editorial content ────────────────────────────────────── */
.hero-content {
  display: flex;
  flex-direction: column;
  gap: 0;
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 1s var(--ease), transform 1s var(--ease);
}

.hero-content.visible {
  opacity: 1;
  transform: translateY(0);
}

/* ── Metadata bar ──────────────────────────────────────────────── */
.hero-meta {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: clamp(1.8rem, 3vw, 2.8rem);
}

.meta-line {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--muted);
}

[dir='rtl'] .meta-line {
  letter-spacing: 0.04em;
}

.meta-sep {
  color: var(--accent);
  font-weight: 300;
  font-size: 0.8rem;
}

/* ── Name: editorial wordmark ──────────────────────────────────── */
.hero-name {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-bottom: clamp(2rem, 3.5vw, 3rem);
}

.name-first {
  font-family: var(--font-display);
  font-size: clamp(3.8rem, 9vw, 7.5rem);
  font-weight: 500;
  line-height: 0.95;
  letter-spacing: -0.03em;
  color: var(--ink);
  display: block;
}

[dir='rtl'] .name-first {
  letter-spacing: 0;
}

.name-second {
  font-family: var(--font-display);
  font-size: clamp(2.6rem, 6.2vw, 5.2rem);
  font-weight: 400;
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: var(--ink-2);
  padding-left: clamp(0.5rem, 2vw, 2.5rem);
  display: block;
}

[dir='rtl'] .name-second {
  padding-left: 0;
  padding-right: clamp(0.5rem, 2vw, 2.5rem);
  letter-spacing: 0;
}

/* ── Bottom row: tagline + availability + CTAs ─────────────────── */
.hero-bottom {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 2rem;
}

.hero-bottom-left {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.hero-tagline {
  font-size: clamp(0.92rem, 1.4vw, 1.08rem);
  font-weight: 300;
  color: var(--ink-2);
  max-width: 38ch;
  line-height: 1.8;
  margin-bottom: 2rem;
}

.hero-actions {
  display: flex;
  gap: 0.75rem;
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

.hero-availability {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  white-space: nowrap;
  flex-shrink: 0;
  padding-bottom: 0.15rem;
}

.avail-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent);
  animation: pulse 2.4s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(158, 58, 78, 0.4); }
  55% { box-shadow: 0 0 0 5px rgba(158, 58, 78, 0); }
}

/* ── Right: editorial decorative composition ────────────────────── */
.hero-deco {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: clamp(280px, 45vh, 420px);
  width: clamp(100px, 14vw, 200px);
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 1.1s var(--ease) 0.2s, transform 1.1s var(--ease) 0.2s;
}

.hero-deco.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Vertical editorial line */
.deco-line {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    var(--accent) 20%,
    var(--accent) 80%,
    transparent 100%
  );
}

[dir='rtl'] .deco-line {
  left: auto;
  right: 0;
}

/* Faint oversized background text */
.deco-text {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  pointer-events: none;
}

.deco-text span {
  font-family: var(--font-display);
  font-size: clamp(2.2rem, 4vw, 3.8rem);
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: transparent;
  -webkit-text-stroke: 1px var(--hairline-strong);
  text-stroke: 1px var(--hairline-strong);
  writing-mode: vertical-rl;
  text-orientation: mixed;
}

[dir='rtl'] .deco-text span {
  writing-mode: vertical-lr;
}

/* Small vertical label */
.deco-label {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%) rotate(90deg);
  transform-origin: center;
  white-space: nowrap;
}

[dir='rtl'] .deco-label {
  right: auto;
  left: 0;
}

.deco-label-text {
  font-size: 0.58rem;
  font-weight: 600;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--muted);
}

[dir='rtl'] .deco-label-text {
  letter-spacing: 0.06em;
}

/* ── Responsive ────────────────────────────────────────────────── */
@media (max-width: 1024px) {
  .hero-deco {
    display: none;
  }

  .hero-inner {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .hero {
    padding-block: 4rem 1.5rem;
  }

  .hero-meta {
    margin-bottom: 1.5rem;
  }

  .name-first {
    font-size: clamp(3rem, 14vw, 4.5rem);
  }

  .name-second {
    font-size: clamp(2rem, 9.5vw, 3rem);
    padding-left: 0.3rem;
  }

  [dir='rtl'] .name-second {
    padding-right: 0.3rem;
  }

  .hero-bottom {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.2rem;
  }

  .hero-tagline {
    max-width: 100%;
    margin-bottom: 1.5rem;
  }
}

@media (max-width: 480px) {
  .hero {
    padding-block: 3.5rem 1rem;
  }

  .hero-meta {
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 1.2rem;
  }

  .name-first {
    font-size: clamp(2.6rem, 13vw, 3.5rem);
  }

  .name-second {
    font-size: clamp(1.7rem, 8.5vw, 2.4rem);
  }

  .hero-actions {
    flex-direction: column;
    width: 100%;
  }

  .hero-actions .btn {
    width: 100%;
    justify-content: center;
  }

  .hero-availability {
    font-size: 0.65rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-content,
  .hero-deco {
    opacity: 1;
    transform: none;
    transition: none;
  }

  .avail-dot {
    animation: none;
  }
}
</style>
