<template>
  <section id="approach" class="approach">
    <div class="container">
      <div class="approach-header fade-in">
        <span class="section-label">How I Work</span>
        <h2 class="section-title">My Approach</h2>
        <p class="section-subtitle">
          A clear, strategic process that turns ideas into measurable results.
        </p>
      </div>

      <div class="steps-grid fade-in">
        <div
          v-for="(step, index) in steps"
          :key="step.title"
          class="step-card"
        >
          <div class="step-number">{{ String(index + 1).padStart(2, '0') }}</div>
          <div class="step-line" v-if="index < steps.length - 1"></div>
          <h3 class="step-title">{{ step.title }}</h3>
          <p class="step-desc">{{ step.desc }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useScrollReveal } from '../composables/useScrollReveal'

useScrollReveal()

const steps = [
  {
    title: 'Understand',
    desc: 'Deep dive into your brand, audience, competitors, and goals to build a solid foundation.',
  },
  {
    title: 'Plan',
    desc: 'Develop a tailored content strategy with a structured monthly calendar.',
  },
  {
    title: 'Create',
    desc: 'Produce clear, relevant, on-brand content that captures attention and drives engagement.',
  },
  {
    title: 'Optimize',
    desc: 'Analyze performance data, gather insights, and continuously refine for better results.',
  },
]
</script>

<style scoped>
.approach {
  background: var(--color-bg);
}

.approach-header {
  text-align: center;
  margin-bottom: 4rem;
}

.approach-header .section-subtitle {
  margin: 0 auto;
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
  position: relative;
}

.step-card {
  text-align: center;
  position: relative;
  padding: 0 1rem;
}

.step-number {
  font-family: var(--font-heading);
  font-size: 3rem;
  font-weight: 300;
  color: var(--color-primary);
  opacity: 0.5;
  margin-bottom: 1.25rem;
  line-height: 1;
}

.step-line {
  display: none;
}

.step-title {
  font-family: var(--font-heading);
  font-size: 1.35rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
  color: var(--color-text);
}

.step-desc {
  font-size: 0.875rem;
  color: #8a7e7e;
  line-height: 1.7;
}

@media (max-width: 768px) {
  .steps-grid {
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }

  .step-card {
    text-align: left;
    padding-left: 2.5rem;
    position: relative;
  }

  .step-number {
    position: absolute;
    left: 0;
    top: -0.2rem;
    font-size: 1.5rem;
  }

  .step-line {
    display: block;
    position: absolute;
    left: 0.55rem;
    top: 2rem;
    bottom: -2.5rem;
    width: 1px;
    background: var(--color-neutral);
  }

  .step-card:last-child .step-line {
    display: none;
  }
}
</style>
