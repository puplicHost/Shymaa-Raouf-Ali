<template>
  <section id="certifications" class="certifications">
    <div class="container">
      <div class="certs-header fade-in">
        <span class="section-label">Certifications</span>
        <h2 class="section-title">Continuous Learning</h2>
        <p class="section-subtitle">
          Committed to staying current with industry standards and emerging technologies.
        </p>
      </div>

      <div class="certs-scroll-wrapper fade-in">
        <div class="certs-track" ref="track">
          <div
            v-for="(cert, index) in certifications"
            :key="cert.name"
            class="cert-card"
          >
            <div class="cert-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
              </svg>
            </div>
            <div class="cert-info">
              <h3 class="cert-name">{{ cert.name }}</h3>
              <span class="cert-issuer">{{ cert.issuer }}</span>
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

const certifications = [
  { name: 'Google AI Professional Certificate', issuer: 'Google' },
  { name: 'Generative AI for Digital Marketing Specialization', issuer: 'Coursera' },
  { name: 'AI Content Mastery for Social Media', issuer: 'Industry Certification' },
  { name: 'Meta Social Media Marketing Professional Certificate', issuer: 'Meta' },
  { name: 'Google Digital Marketing & E-commerce Certificate', issuer: 'Google' },
  { name: 'HubSpot Content Marketing Certification', issuer: 'HubSpot' },
  { name: 'DELF B1 — French Language Certification', issuer: 'France Éducation' },
]
</script>

<style scoped>
.certifications {
  background: linear-gradient(180deg, var(--color-bg), rgba(232, 224, 220, 0.15), var(--color-bg));
}

.certs-header {
  text-align: center;
  margin-bottom: 3.5rem;
}

.certs-header .section-subtitle {
  margin: 0 auto;
}

.certs-scroll-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  margin: 0 calc(var(--container-padding) * -1);
  padding: 0 var(--container-padding);
}

.certs-scroll-wrapper::-webkit-scrollbar {
  display: none;
}

.certs-track {
  display: flex;
  gap: 1.25rem;
  padding-bottom: 1rem;
  min-width: min-content;
}

.cert-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.75rem;
  background: var(--color-white);
  border: 1px solid var(--color-neutral);
  border-radius: 12px;
  min-width: 320px;
  flex-shrink: 0;
  transition: all 0.35s ease;
  cursor: default;
}

.cert-card:hover {
  border-color: var(--color-primary);
  box-shadow: 0 6px 24px rgba(139, 111, 114, 0.08);
}

.cert-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(196, 168, 176, 0.15), rgba(139, 111, 114, 0.1));
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-deep);
  flex-shrink: 0;
}

.cert-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.cert-name {
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text);
  line-height: 1.4;
}

.cert-issuer {
  font-size: 0.75rem;
  color: var(--color-deep);
  font-weight: 400;
  letter-spacing: 0.04em;
}

@media (max-width: 768px) {
  .cert-card {
    min-width: 280px;
    padding: 1rem 1.25rem;
  }
}
</style>
