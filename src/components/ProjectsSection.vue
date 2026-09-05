<script setup>
import { useScrollReveal } from '../composables/useScrollReveal'
import { useLocale } from '../composables/useLocale.js'
import IconGlyph from './IconGlyph.vue'
import { ui } from '../data/icons.js'

useScrollReveal()

const { t, isAr } = useLocale()

const projects = [
  {
    name: 'Jarrash Sabia',
    nameAr: 'جرش صبية',
    industry: 'E-commerce',
    industryAr: 'تجارة إلكترونية',
    desc: 'Full social media management for a furniture e-commerce brand targeting the Saudi market.',
    descAr: 'إدارة كاملة للسوشيال ميديا لعلامة أثاث وتجارة إلكترونية تستهدف السوق السعودي.',
    url: 'https://www.instagram.com/jarrash_sabia',
  },
  {
    name: 'Wagf Momnah',
    nameAr: 'وقف ممنوع',
    industry: 'Social / NGO',
    industryAr: 'اجتماعي / جمعية',
    desc: 'Content strategy and community management for a social initiative brand.',
    descAr: 'استراتيجية محتوى وإدارة مجتمع لعلامة مبادرة اجتماعية.',
    url: 'https://www.instagram.com/wagfmomnah',
  },
  {
    name: 'Comfort Begins',
    nameAr: 'كومفورت بيجنز',
    industry: 'Lifestyle / Cleaning',
    industryAr: 'لايف ستايل / تنظيف',
    desc: 'Brand storytelling and content creation for a lifestyle cleaning services company.',
    descAr: 'سرد قصة العلامة وإبداع المحتوى لشركة خدمات تنظيف.',
    url: 'https://www.instagram.com/comfort_begins',
  },
  {
    name: 'Alwan Elhaz Elsaed',
    nameAr: 'ألوان الحظ السعيد',
    industry: 'Creative / Services',
    industryAr: 'إبداعي / خدمات',
    desc: 'Creative content direction and social media management for a services brand.',
    descAr: 'إدارة إبداعية للمحتوى وإدارة سوشيال ميديا لعلامة خدمات.',
    url: 'https://www.instagram.com/alwanelhaz_elsaed',
  },
  {
    name: 'Velora Cosmatics',
    nameAr: 'فيلورا كوزماتكس',
    industry: 'Beauty & E-commerce',
    industryAr: 'جمال وتجارة إلكترونية',
    desc: 'Visual content strategy and product marketing for a cosmetics brand.',
    descAr: 'استراتيجية محتوى بصري وتسويق منتجات لعلامة مستحضرات تجميل.',
    url: 'https://www.instagram.com/veloracosmatic',
  },
  {
    name: 'Lazor',
    nameAr: 'لازور',
    industry: 'Services / E-commerce',
    industryAr: 'خدمات / تجارة إلكترونية',
    desc: 'End-to-end social media management and content creation.',
    descAr: 'إدارة سوشيال ميديا وإبداع محتوى من الألف إلى الياء.',
    url: 'https://www.instagram.com/lazor_a6',
  },
]
</script>

<template>
  <section id="work" class="projects">
    <div class="container">
      <div class="section-head projects-head fade-in">
        <span class="eyebrow">{{ t('projects.label') }}</span>
        <div class="projects-head-row">
          <h2 class="section-title">{{ t('projects.title') }}</h2>
          <span class="count-mark">{{ String(projects.length).padStart(2, '0') }}</span>
        </div>
        <p class="section-subtitle">{{ t('projects.subtitle') }}</p>
      </div>

      <div class="projects-list fade-in">
        <a
          v-for="(project, index) in projects"
          :key="project.name"
          :href="project.url"
          target="_blank"
          rel="noopener noreferrer"
          class="project-row"
        >
          <span class="project-no" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
          <div class="project-main">
            <h3 class="project-name">{{ isAr ? project.nameAr : project.name }}</h3>
            <p class="project-desc">{{ isAr ? project.descAr : project.desc }}</p>
          </div>
          <span class="project-industry">{{ isAr ? project.industryAr : project.industry }}</span>
          <span class="project-action">
            {{ t('projects.viewOn') }}
            <IconGlyph :path="ui.arrowTopRight" :size="16" class="project-arrow" />
          </span>
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.projects {
  background: var(--paper);
  border-top: 1px solid var(--hairline);
}

.projects-head .section-title {
  margin-bottom: 0;
}

.projects-head-row {
  display: flex;
  align-items: baseline;
  gap: 1.25rem;
}

.count-mark {
  font-family: var(--font-display);
  font-size: clamp(1rem, 1.6vw, 1.3rem);
  font-style: italic;
  color: var(--accent);
}

.projects-head .section-subtitle {
  margin-top: 1.1rem;
}

.projects-list {
  border-top: 2px solid var(--ink);
}

.project-row {
  display: grid;
  grid-template-columns: clamp(2.5rem, 4vw, 4.5rem) 1fr minmax(10rem, 0.8fr) auto;
  align-items: center;
  gap: clamp(1rem, 3vw, 2.5rem);
  padding-block: clamp(1.15rem, 2.2vw, 1.7rem);
  border-bottom: 1px solid var(--hairline);
  transition: background-color 0.3s ease, color 0.3s ease,
    padding-inline 0.35s var(--ease);
}

.project-row:hover {
  background: var(--ink);
  color: var(--on-ink);
  padding-inline: 1.25rem;
}

.project-no {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  color: var(--accent);
  transition: color 0.3s ease;
}

.project-name {
  font-size: clamp(1.35rem, 2.8vw, 2rem);
  font-weight: 500;
  letter-spacing: -0.01em;
  line-height: 1.2;
  transition: transform 0.35s var(--ease);
  transform-origin: left;
}

[dir='rtl'] .project-name {
  transform-origin: right;
}

.project-row:hover .project-name {
  transform: translateX(6px);
}

[dir='rtl'] .project-row:hover .project-name {
  transform: translateX(-6px);
}

.project-desc {
  color: var(--muted);
  font-size: 0.88rem;
  line-height: 1.65;
  margin-top: 0.3rem;
  max-width: 54ch;
  transition: color 0.3s ease;
}

.project-row:hover .project-desc {
  color: rgba(244, 238, 228, 0.68);
}

.project-industry {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-2);
  transition: color 0.3s ease;
}

[dir='rtl'] .project-industry {
  letter-spacing: 0.02em;
}

.project-row:hover .project-industry {
  color: rgba(244, 238, 228, 0.85);
}

.project-action {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--muted);
  transition: color 0.3s ease;
}

.project-row:hover .project-action {
  color: var(--on-ink);
}

.project-arrow {
  transition: transform 0.3s var(--ease);
}

.project-row:hover .project-arrow {
  transform: translate(3px, -3px);
}

@media (max-width: 900px) {
  .project-row {
    grid-template-columns: 2.25rem 1fr auto;
  }

  .project-industry {
    display: none;
  }

  .project-action {
    font-size: 0.66rem;
  }
}

@media (max-width: 600px) {
  .project-row {
    grid-template-columns: 2rem 1fr;
    gap: 0.8rem;
  }

  .project-action {
    display: none;
  }

  .project-row:hover {
    padding-inline: 0.75rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .project-row,
  .project-name,
  .project-arrow {
    transition: none;
  }

  .project-row:hover .project-name {
    transform: none;
  }

  .project-row:hover .project-arrow {
    transform: none;
  }
}
</style>