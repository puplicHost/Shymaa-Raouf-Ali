<template>
  <section id="industries" class="industries">
    <div class="container">
      <div class="industries-inner fade-in">
        <div class="industries-text">
          <span class="section-label">Industries</span>
          <h2 class="section-title">Sectors I've Worked In</h2>
          <p class="section-subtitle">
            Diverse experience across multiple industries, with deep understanding of each market's unique needs.
          </p>
        </div>

        <div class="industries-list">
          <div
            v-for="(industry, index) in industries"
            :key="industry.name"
            class="industry-badge"
            :style="{ transitionDelay: `${index * 0.06}s` }"
          >
            <div class="badge-dot"></div>
            <div class="badge-content">
              <span class="badge-name">{{ industry.name }}</span>
              <span class="badge-example" v-if="industry.example">{{ industry.example }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useScrollReveal } from '../composables/useScrollReveal'

useScrollReveal()

const industries = [
  { name: 'Furniture & Home', example: 'Adrak Furniture' },
  { name: 'Marble', example: 'Afaag Marble' },
  { name: 'Pharmacy & Healthcare', example: 'Rosheta Pharmacies' },
  { name: 'Education', example: 'Smart Junior English Academy' },
  { name: 'Cleaning Services', example: 'Alwan Happy Luck' },
  { name: 'Beauty & E-commerce', example: 'Velora Cosmatics' },
  { name: 'Social Media Projects', example: 'Various Brands' },
]
</script>

<style scoped>
.industries {
  background: linear-gradient(180deg, var(--color-bg), rgba(232, 224, 220, 0.15), var(--color-bg));
}

.industries-inner {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 4rem;
  align-items: center;
}

.industries-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.industry-badge {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.1rem 1.5rem;
  background: var(--color-white);
  border: 1px solid var(--color-neutral);
  border-radius: 12px;
  transition: all 0.35s ease;
  cursor: default;
}

.industry-badge:hover {
  border-color: var(--color-primary);
  transform: translateX(6px);
  box-shadow: 0 4px 20px rgba(139, 111, 114, 0.06);
}

.badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
  flex-shrink: 0;
  transition: background 0.3s ease;
}

.industry-badge:hover .badge-dot {
  background: var(--color-deep);
}

.badge-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
  gap: 1rem;
}

.badge-name {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-text);
}

.badge-example {
  font-size: 0.8rem;
  color: #8a7e7e;
  font-style: italic;
}

@media (max-width: 768px) {
  .industries-inner {
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }

  .badge-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.2rem;
  }
}
</style>
