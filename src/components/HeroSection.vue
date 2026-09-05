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
    <div class="hero-gradient" aria-hidden="true"></div>
    <div class="hero-grid" aria-hidden="true"></div>
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
              <a href="#work" class="btn btn-accent">
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
        <div class="deco-number">01</div>
        <div class="deco-line"></div>
        <div class="deco-text">
          <span>SOCIAL</span>
          <span>MEDIA</span>
        </div>
        <div class="deco-label">
          <span class="deco-label-text">{{ isAr ? 'مصممة محتوى' : 'Content Designer' }}</span>
        </div>
        <div class="deco-keywords">
          <span>STRATEGY</span>
          <span class="deco-dot" aria-hidden="true"></span>
          <span>CONTENT</span>
          <span class="deco-dot" aria-hidden="true"></span>
          <span>GROWTH</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-block: 5rem 2rem;
  overflow: hidden;
  background: var(--bg);
}

/* ── Gradient layer ────────────────────────────────────────────── */
.hero-gradient {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 60% 55% at 15% 40%, rgba(166, 116, 255, 0.18) 0%, transparent 70%),
    radial-gradient(ellipse 50% 50% at 80% 55%, rgba(44, 232, 200, 0.10) 0%, transparent 65%),
    radial-gradient(ellipse 40% 35% at 25% 80%, rgba(166, 116, 255, 0.08) 0%, transparent 60%);
}

/* ── Grid layer ────────────────────────────────────────────────── */
.hero-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(28, 34, 48, 0.3) 1px, transparent 1px),
    linear-gradient(90deg, rgba(28, 34, 48, 0.3) 1px, transparent 1px);
  background-size: clamp(40px, 5vw, 60px) clamp(40px, 5vw, 60px);
  mask-image: radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 70%);
}

.hero-inner {
  position: relative;
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
  color: var(--cyan);
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
  font-weight: 700;
  line-height: 0.92;
  letter-spacing: -0.04em;
  color: var(--text);
  display: block;
}

[dir='rtl'] .name-first {
  letter-spacing: 0;
}

.name-second {
  font-family: var(--font-display);
  font-size: clamp(2.6rem, 6.2vw, 5.2rem);
  font-weight: 500;
  line-height: 1.05;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
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
  color: var(--muted);
  max-width: 38ch;
  line-height: 1.8;
  margin-bottom: 2rem;
}

.hero-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.hero-actions .btn-accent:hover .arrow {
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
  background: var(--cyan);
  box-shadow: 0 0 8px rgba(44, 232, 200, 0.5);
  animation: pulse 2.4s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 8px rgba(44, 232, 200, 0.5); }
  55% { box-shadow: 0 0 16px rgba(44, 232, 200, 0); }
}

/* ── Right: editorial decorative composition ────────────────────── */
.hero-deco {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: clamp(320px, 50vh, 480px);
  width: clamp(120px, 16vw, 220px);
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 1.1s var(--ease) 0.2s, transform 1.1s var(--ease) 0.2s;
}

.hero-deco.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Small cyan number */
.deco-number {
  position: absolute;
  top: 0;
  left: 0;
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--cyan);
  letter-spacing: 0.1em;
}

/* Vertical editorial line */
.deco-line {
  position: absolute;
  left: 0;
  top: 2.5rem;
  bottom: 2.5rem;
  width: 2px;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    var(--cyan) 15%,
    var(--accent) 50%,
    var(--cyan) 85%,
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
  font-size: clamp(2.4rem, 4.5vw, 4rem);
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: transparent;
  -webkit-text-stroke: 1px var(--border-strong);
  text-stroke: 1px var(--border-strong);
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
  color: var(--cyan);
}

[dir='rtl'] .deco-label-text {
  letter-spacing: 0.06em;
}

/* Keywords row */
.deco-keywords {
  position: absolute;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.5rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--muted);
}

.deco-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--cyan);
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
