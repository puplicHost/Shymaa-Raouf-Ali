<template>
  <section id="work" class="projects">
    <div class="container">
      <div class="projects-header fade-in">
        <span class="section-label">Selected Work</span>
        <h2 class="section-title">Projects I've Managed</h2>
        <p class="section-subtitle">
          A curated selection of brands I've helped grow through strategic social media management.
        </p>
      </div>

      <div class="projects-grid fade-in">
        <a
          v-for="(project, index) in projects"
          :key="project.name"
          :href="project.link"
          target="_blank"
          rel="noopener noreferrer"
          class="project-card"
          :style="{ transitionDelay: `${index * 0.1}s` }"
        >
          <div class="project-header">
            <span class="project-number">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="project-industry">{{ project.industry }}</span>
          </div>
          <div class="project-body">
            <h3 class="project-name">{{ project.name }}</h3>
            <p class="project-desc">{{ project.desc }}</p>
          </div>
          <div class="project-footer">
            <span class="project-link-text">View on Instagram</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M7 17L17 7M17 7H7M17 7v10"/>
            </svg>
          </div>
          <div class="project-accent"></div>
        </a>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useScrollReveal } from '../composables/useScrollReveal'

useScrollReveal()

const projects = [
  {
    name: 'Jarrash Sabia',
    industry: 'E-commerce',
    desc: 'Full social media management for a furniture e-commerce brand targeting the Saudi market.',
    link: 'https://www.instagram.com/jarrash_sabia',
  },
  {
    name: 'Wagf Momnah',
    industry: 'Social / NGO',
    desc: 'Content strategy and community management for a social initiative brand.',
    link: 'https://www.instagram.com/wagfmomnah',
  },
  {
    name: 'Comfort Begins',
    industry: 'Lifestyle / Cleaning',
    desc: 'Brand storytelling and content creation for a lifestyle cleaning services company.',
    link: 'https://www.instagram.com/comfort_begins',
  },
  {
    name: 'Alwan Elhaz Elsaed',
    industry: 'Creative / Services',
    desc: 'Creative content direction and social media management for a services brand.',
    link: 'https://www.instagram.com/alwanelhaz_elsaed',
  },
  {
    name: 'Velora Cosmatics',
    industry: 'Beauty & E-commerce',
    desc: 'Visual content strategy and product marketing for a cosmetics brand.',
    link: 'https://www.instagram.com/veloracosmatic',
  },
  {
    name: 'Lazor',
    industry: 'Services / E-commerce',
    desc: 'End-to-end social media management and content creation.',
    link: 'https://www.instagram.com/lazor_a6',
  },
]
</script>

<style scoped>
.projects {
  background: var(--color-bg);
}

.projects-header {
  text-align: center;
  margin-bottom: 4rem;
}

.projects-header .section-subtitle {
  margin: 0 auto;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.project-card {
  display: flex;
  flex-direction: column;
  background: var(--color-white);
  border: 1px solid var(--color-neutral);
  border-radius: 14px;
  padding: 2rem;
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;
}

.project-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-4px);
  box-shadow: 0 16px 48px rgba(139, 111, 114, 0.1);
}

.project-accent {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-deep));
  transform: scaleX(0);
  transition: transform 0.4s ease;
  transform-origin: left;
}

.project-card:hover .project-accent {
  transform: scaleX(1);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.project-number {
  font-family: var(--font-heading);
  font-size: 0.85rem;
  color: var(--color-primary);
  font-weight: 500;
}

.project-industry {
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-deep);
  padding: 0.3rem 0.75rem;
  background: rgba(196, 168, 176, 0.12);
  border-radius: 100px;
}

.project-body {
  flex: 1;
  margin-bottom: 1.5rem;
}

.project-name {
  font-family: var(--font-heading);
  font-size: 1.4rem;
  font-weight: 500;
  margin-bottom: 0.6rem;
  color: var(--color-text);
}

.project-desc {
  font-size: 0.875rem;
  color: #8a7e7e;
  line-height: 1.65;
}

.project-footer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-deep);
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  transition: gap 0.3s ease;
}

.project-card:hover .project-footer {
  gap: 0.75rem;
}

@media (max-width: 768px) {
  .projects-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .project-card {
    padding: 1.5rem;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .projects-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
