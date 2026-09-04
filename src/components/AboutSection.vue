<template>
  <section id="about" class="about">
    <div class="container">
      <div class="about-grid fade-in">
        <div class="about-text">
          <span class="section-label">About Me</span>
          <h2 class="section-title">Crafting Digital<br />Experiences That Matter</h2>

          <div class="about-description">
            <p>
              Social Media & Content Creator with 1+ year of hands-on experience managing
              brand presence across Facebook, Instagram, TikTok, Snapchat, X, and LinkedIn.
              My primary focus is the Saudi market — understanding its culture, trends, and
              audience behavior to create content that resonates.
            </p>
            <p>
              I bring expertise in content planning, copywriting, audience analysis, and
              performance optimization. I'm also skilled in leveraging AI tools for content
              development and marketing workflows — staying ahead of the curve.
            </p>
          </div>

          <div class="about-details">
            <div class="detail-item">
              <span class="detail-label">Languages</span>
              <span class="detail-value">Arabic (Native) · English (Fluent) · French (Fluent)</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Education</span>
              <span class="detail-value">BA French Language — Suez Canal University, 2024 (Very Good)</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Location</span>
              <span class="detail-value">Ismailia, Egypt · Serving the Saudi Market</span>
            </div>
          </div>
        </div>

        <div class="about-visual">
          <div class="visual-card">
            <div class="card-pattern">
              <div class="pattern-dot" v-for="n in 25" :key="n"></div>
            </div>
            <div class="card-accent-line"></div>
          </div>
          <div class="stats-float">
            <div class="stat">
              <span class="stat-number">1+</span>
              <span class="stat-label">Year Experience</span>
            </div>
            <div class="stat">
              <span class="stat-number">6+</span>
              <span class="stat-label">Platforms</span>
            </div>
            <div class="stat">
              <span class="stat-number">3</span>
              <span class="stat-label">Languages</span>
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
</script>

<style scoped>
.about {
  background: var(--color-bg);
}

.about-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 5rem;
  align-items: center;
}

.about-description {
  margin-bottom: 2.5rem;
}

.about-description p {
  font-size: 1rem;
  line-height: 1.85;
  color: #5a5252;
  margin-bottom: 1rem;
}

.about-description p:last-child {
  margin-bottom: 0;
}

.about-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-neutral);
}

.detail-item {
  display: flex;
  gap: 1.5rem;
  align-items: baseline;
}

.detail-label {
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-deep);
  min-width: 100px;
  flex-shrink: 0;
}

.detail-value {
  font-size: 0.925rem;
  color: #5a5252;
  line-height: 1.6;
}

.about-visual {
  position: relative;
  display: flex;
  justify-content: center;
}

.visual-card {
  width: 340px;
  height: 420px;
  background: linear-gradient(145deg, var(--color-neutral), rgba(196, 168, 176, 0.2));
  border-radius: 16px;
  position: relative;
  overflow: hidden;
}

.card-pattern {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
  padding: 40px;
  opacity: 0.3;
}

.pattern-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-deep);
}

.card-accent-line {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-deep));
}

.stats-float {
  position: absolute;
  right: -20px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stat {
  background: var(--color-bg);
  padding: 1rem 1.25rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  text-align: center;
  border: 1px solid var(--color-neutral);
}

.stat-number {
  display: block;
  font-family: var(--font-heading);
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-deep);
}

.stat-label {
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #8a7e7e;
}

@media (max-width: 768px) {
  .about-grid {
    grid-template-columns: 1fr;
    gap: 3rem;
  }

  .about-visual {
    order: -1;
  }

  .visual-card {
    width: 260px;
    height: 320px;
  }

  .stats-float {
    position: relative;
    right: auto;
    top: auto;
    transform: none;
    flex-direction: row;
    margin-top: 1.5rem;
    justify-content: center;
  }

  .detail-item {
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>
