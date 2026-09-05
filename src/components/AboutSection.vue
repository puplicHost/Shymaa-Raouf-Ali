<script setup>
import { useScrollReveal } from '../composables/useScrollReveal'
import { useLocale } from '../composables/useLocale.js'
import SocialIcon from './SocialIcon.vue'
import { brand, ui } from '../data/icons.js'

useScrollReveal()

const { t } = useLocale()

const contact = {
  email: 'raoufshimaa587@gmail.com',
  phone: '+201282354052',
  whatsapp: '201282354052',
  linkedin: 'https://www.linkedin.com/in/shymaa-raouf-102a81361/',
}
</script>

<template>
  <section id="about" class="about">
    <div class="container about-grid">
      <div class="about-copy fade-in">
        <span class="eyebrow">{{ t('about.label') }}</span>
        <h2 class="section-title">{{ t('about.title') }}</h2>

        <div class="about-prose">
          <p>{{ t('about.p1') }}</p>
          <p>{{ t('about.p2') }}</p>
        </div>

        <dl class="about-meta">
          <div class="meta-row">
            <dt>{{ t('about.languagesLabel') }}</dt>
            <dd>{{ t('about.languagesValue') }}</dd>
          </div>
          <div class="meta-row">
            <dt>{{ t('about.educationLabel') }}</dt>
            <dd>{{ t('about.educationValue') }}</dd>
          </div>
          <div class="meta-row">
            <dt>{{ t('about.locationLabel') }}</dt>
            <dd>{{ t('about.locationValue') }}</dd>
          </div>
        </dl>

        <div class="about-socials">
          <SocialIcon
            :href="`mailto:${contact.email}`"
            :label="t('contact.email')"
            :path="ui.email"
            :external="false"
          />
          <SocialIcon
            :href="contact.linkedin"
            :label="t('contact.linkedin')"
            :path="ui.linkedin"
          />
          <SocialIcon
            :href="`https://wa.me/${contact.whatsapp}`"
            :label="t('contact.whatsapp')"
            :path="brand.whatsapp"
          />
        </div>
      </div>

      <aside class="about-index fade-in" aria-hidden="true">
        <div class="index-card">
          <div class="index-card-head">
            <span>Portfolio — Index</span>
            <span>Nº 01</span>
          </div>
          <div class="index-row">
            <span class="index-value">{{ t('about.statYearsValue') }}</span>
            <span class="index-label">{{ t('about.statYears') }}</span>
          </div>
          <div class="index-row">
            <span class="index-value">{{ t('about.statPlatformsValue') }}</span>
            <span class="index-label">{{ t('about.statPlatforms') }}</span>
          </div>
          <div class="index-row">
            <span class="index-value">{{ t('about.statLanguagesValue') }}</span>
            <span class="index-label">{{ t('about.statLanguages') }}</span>
          </div>
        </div>
        <p class="about-note">{{ t('about.titleproof') }}</p>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.about {
  background: var(--bg);
  border-top: 1px solid var(--border);
}

.about-grid {
  display: grid;
  grid-template-columns: 1.18fr 0.82fr;
  gap: clamp(3rem, 7vw, 7rem);
  align-items: start;
}

.about-copy .section-title {
  margin-bottom: 1.4rem;
}

.about-prose {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  margin-bottom: 2.2rem;
}

.about-prose p {
  color: var(--muted);
  font-size: 1.02rem;
  line-height: 1.9;
  max-width: 58ch;
}

.about-prose p:first-child::first-letter {
  font-family: var(--font-display);
  font-size: 2.2em;
  float: inline-start;
  line-height: 0.82;
  padding-inline-end: 0.12em;
  color: var(--accent);
  font-weight: 700;
}

.about-prose :deep(strong) {
  color: var(--accent);
  font-weight: 600;
}

.about-meta {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--border);
}

.meta-row {
  display: grid;
  grid-template-columns: 12ch 1fr;
  gap: 1.5rem;
  padding-block: 0.95rem;
  border-bottom: 1px solid var(--border);
}

.meta-row dt {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--muted);
  padding-top: 0.1rem;
}

[dir='rtl'] .meta-row dt {
  letter-spacing: 0.02em;
}

.meta-row dd {
  color: var(--text);
  font-size: 0.95rem;
  line-height: 1.7;
}

.about-socials {
  display: flex;
  gap: 0.7rem;
  margin-top: 2rem;
}

/* Index card ----------------------------------------------------------- */
.about-index {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  position: sticky;
  top: 6.5rem;
  align-self: start;
}

.index-card {
  background: var(--surface);
  color: var(--on-surface);
  padding: clamp(1.75rem, 3.5vw, 2.75rem);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  box-shadow: 12px 12px 0 0 rgba(166, 116, 255, 0.08);
}

.index-card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.66rem;
  font-weight: 600;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--on-surface-dim);
  border-bottom: 1px solid var(--border);
  padding-bottom: 1.1rem;
  margin-bottom: 0.4rem;
}

[dir='rtl'] .index-card-head {
  letter-spacing: 0.02em;
}

.index-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding-block: 1.15rem;
  border-bottom: 1px solid var(--border);
}

.index-row:last-child {
  border-bottom: none;
}

.index-value {
  font-family: var(--font-display);
  font-size: clamp(2rem, 4vw, 2.8rem);
  font-weight: 700;
  line-height: 1;
  color: var(--on-surface);
}

.index-label {
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted);
}

[dir='rtl'] .index-label {
  letter-spacing: 0.02em;
}

.about-note {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1.05rem;
  color: var(--muted);
  line-height: 1.7;
  border-inline-start: 2px solid var(--accent);
  padding-inline-start: 1rem;
  max-width: 34ch;
}

@media (max-width: 900px) {
  .about-grid {
    grid-template-columns: 1fr;
    gap: 3rem;
  }

  .about-index {
    position: static;
  }
}

@media (max-width: 560px) {
  .meta-row {
    grid-template-columns: 1fr;
    gap: 0.3rem;
    padding-block: 1rem;
  }
}
</style>
