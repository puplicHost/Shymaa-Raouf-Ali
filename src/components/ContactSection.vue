<script setup>
import { useScrollReveal } from '../composables/useScrollReveal'
import { useLocale } from '../composables/useLocale.js'
import IconGlyph from './IconGlyph.vue'
import { brand, ui } from '../data/icons.js'

useScrollReveal()

const { t } = useLocale()

const email = 'raoufshimaa587@gmail.com'
const phoneLink = '+201282354052'
const phoneDisplay = '+20 128 235 4052'
const whatsapp = '201282354052'
const linkedin = 'https://www.linkedin.com/in/shymaa-raouf-102a81361/'
</script>

<template>
  <section id="contact" class="contact">
    <div class="contact-ghost" aria-hidden="true">SR</div>
    <div class="container contact-inner fade-in">
      <span class="eyebrow">{{ t('contact.label') }}</span>

      <h2 class="contact-title">{{ t('contact.title') }}</h2>
      <p class="contact-subtitle">{{ t('contact.subtitle') }}</p>

      <p class="availability">
        <span class="avail-dot" aria-hidden="true"></span>
        {{ t('contact.availability') }}
      </p>

      <a :href="`mailto:${email}`" class="email-cta">
        <span>{{ email }}</span>
        <IconGlyph :path="ui.arrowTopRight" :size="22" class="email-arrow" aria-hidden="true" />
      </a>

      <div class="channels">
        <a
          :href="`https://wa.me/${whatsapp}`"
          target="_blank"
          rel="noopener noreferrer"
          class="channel"
        >
          <IconGlyph :path="brand.whatsapp" :size="20" aria-hidden="true" />
          {{ t('contact.whatsapp') }}
        </a>
        <a
          :href="linkedin"
          target="_blank"
          rel="noopener noreferrer"
          class="channel"
        >
          <IconGlyph :path="ui.linkedin" :size="20" aria-hidden="true" />
          {{ t('contact.linkedin') }}
        </a>
        <a :href="`tel:${phoneLink}`" class="channel">
          <IconGlyph :path="ui.phone" :size="20" aria-hidden="true" />
          {{ phoneDisplay }}
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.contact {
  background: var(--surface);
  color: var(--on-surface);
  border-top: 1px solid var(--border);
  overflow: hidden;
}

.contact-ghost {
  position: absolute;
  top: 50%;
  right: -0.08em;
  transform: translateY(-50%);
  font-family: var(--font-display);
  font-size: clamp(10rem, 32vw, 26rem);
  font-weight: 700;
  line-height: 1;
  color: transparent;
  -webkit-text-stroke: 1px var(--border);
  pointer-events: none;
  user-select: none;
}

[dir='rtl'] .contact-ghost {
  right: auto;
  left: -0.08em;
}

.contact-inner {
  position: relative;
  z-index: 1;
}

.contact .eyebrow {
  color: var(--accent);
}

.contact .eyebrow::before {
  background: var(--accent);
}

.contact-title {
  font-size: clamp(2.2rem, 5.5vw, 4rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text);
  margin-bottom: 1.3rem;
}

[dir='rtl'] .contact-title {
  letter-spacing: 0;
}

.contact-subtitle {
  color: var(--muted);
  font-size: 1.05rem;
  line-height: 1.9;
  max-width: 44ch;
  margin-bottom: 1.6rem;
}

.availability {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.78rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  color: var(--text);
  margin-bottom: 2rem;
}

.avail-dot {
  width: 8px;
  height: 8px;
  background: var(--cyan);
  border-radius: 50%;
  animation: glow 2.4s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(44, 232, 200, 0.45); }
  55% { box-shadow: 0 0 0 7px rgba(44, 232, 200, 0); }
}

.email-cta {
  display: inline-flex;
  align-items: center;
  gap: 1rem;
  font-family: var(--font-display);
  font-size: clamp(1.15rem, 3vw, 1.9rem);
  font-weight: 500;
  color: var(--text);
  border-bottom: 2px solid var(--accent);
  padding-bottom: 0.5rem;
  margin-bottom: 2rem;
  transition: color 0.3s ease;
  word-break: break-all;
}

.email-cta:hover {
  color: var(--accent);
}

.email-arrow {
  transition: transform 0.3s var(--ease);
}

.email-cta:hover .email-arrow {
  transform: translate(4px, -4px);
}

.channels {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
}

.channel {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.85rem 1.4rem;
  border: 1px solid var(--border-strong);
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  color: var(--text);
  transition: border-color 0.3s ease, background-color 0.3s ease, color 0.3s ease;
}

[dir='rtl'] .channel {
  letter-spacing: 0;
}

.channel:hover {
  border-color: var(--cyan);
  background: rgba(44, 232, 200, 0.1);
  color: var(--cyan);
  box-shadow: 0 0 16px rgba(44, 232, 200, 0.15);
}

@media (max-width: 560px) {
  .email-cta {
    align-items: flex-start;
  }
}

@media (prefers-reduced-motion: reduce) {
  .avail-dot {
    animation: none;
  }

  .email-arrow {
    transition: none;
  }
}
</style>
