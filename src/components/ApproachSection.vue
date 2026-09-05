<script setup>
import { useScrollReveal } from '../composables/useScrollReveal'
import { useLocale } from '../composables/useLocale.js'

useScrollReveal()

const { t } = useLocale()
</script>

<template>
  <section id="approach" class="approach">
    <div class="container">
      <div class="section-head approach-head fade-in">
        <span class="eyebrow">{{ t('approach.label') }}</span>
        <h2 class="section-title">{{ t('approach.title') }}</h2>
        <p class="section-subtitle">{{ t('approach.subtitle') }}</p>
      </div>

      <div class="steps fade-in">
        <article
          v-for="(step, index) in t('approach.steps')"
          :key="index"
          class="step"
        >
          <span class="step-no" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
          <h3 class="step-title">{{ step.title }}</h3>
          <p class="step-desc">{{ step.desc }}</p>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.approach {
  background: var(--ink);
  color: var(--on-ink);
  border-top: 1px solid rgba(244, 238, 228, 0.1);
}

.approach .section-title {
  color: var(--on-ink);
}

.approach .section-subtitle {
  color: rgba(244, 238, 228, 0.7);
}

.approach .eyebrow {
  color: rgba(244, 238, 228, 0.55);
}

.approach .eyebrow::before {
  background: var(--accent);
}

.steps {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border-top: 2px solid rgba(244, 238, 228, 0.85);
}

.step {
  padding-block-start: clamp(1.8rem, 3.5vw, 2.75rem);
  padding-inline-end: clamp(1rem, 2vw, 2rem);
  border-inline-end: 1px solid rgba(244, 238, 228, 0.14);
  position: relative;
}

.step:last-child {
  border-inline-end: none;
}

.step-no {
  font-family: var(--font-display);
  font-size: clamp(2.6rem, 5vw, 4.2rem);
  font-weight: 600;
  font-style: italic;
  line-height: 1;
  color: transparent;
  -webkit-text-stroke: 1px rgba(244, 238, 228, 0.4);
  display: block;
  margin-bottom: 1.6rem;
}

.step-title {
  font-size: clamp(1.15rem, 1.8vw, 1.45rem);
  color: var(--on-ink);
  margin-bottom: 0.7rem;
}

.step-desc {
  font-size: 0.94rem;
  line-height: 1.85;
  color: rgba(244, 238, 228, 0.72);
  max-width: 30ch;
}

@media (max-width: 900px) {
  .steps {
    grid-template-columns: 1fr;
  }

  .step {
    border-inline-end: none;
    border-bottom: 1px solid rgba(244, 238, 228, 0.14);
    padding: 1.75rem 0;
  }

  .step:last-child {
    border-bottom: none;
  }

  .step-no {
    margin-bottom: 0.9rem;
  }

  .step-desc {
    max-width: 46ch;
  }
}

@media (prefers-reduced-motion: reduce) {
  .step {
    transition: none;
  }
}
</style>