<template>
  <section id="skills" class="skills">
    <div class="container">
      <div class="skills-header fade-in">
        <span class="section-label">What I Do</span>
        <h2 class="section-title">Services & Expertise</h2>
        <p class="section-subtitle">
          Comprehensive social media solutions tailored to elevate your brand's digital presence.
        </p>
      </div>

      <div class="skills-grid fade-in">
        <div
          v-for="(skill, index) in skills"
          :key="skill.title"
          class="skill-card"
          :style="{ transitionDelay: `${index * 0.08}s` }"
        >
          <div class="skill-icon">
            <component :is="skill.icon" />
          </div>
          <h3 class="skill-title">{{ skill.title }}</h3>
          <p class="skill-desc">{{ skill.desc }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { h } from 'vue'
import { useScrollReveal } from '../composables/useScrollReveal'

useScrollReveal()

const IconSVG = (path) => ({
  render() {
    return h('svg', {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '1.5',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    }, [h('path', { d: path })])
  }
})

const icons = {
  management: IconSVG('M4 6h16M4 12h16M4 18h7'),
  creation: IconSVG('M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'),
  calendar: IconSVG('M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'),
  reels: IconSVG('M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'),
  copywriting: IconSVG('M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'),
  ideas: IconSVG('M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'),
  research: IconSVG('M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'),
  marketing: IconSVG('M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'),
  ai: IconSVG('M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5'),
}

const skills = [
  { title: 'Social Media Management', desc: 'End-to-end management of brand accounts across all major platforms.', icon: icons.management },
  { title: 'Content Creation & Strategy', desc: 'Developing visually compelling and strategically aligned content.', icon: icons.creation },
  { title: 'Content Calendars & Planning', desc: 'Structured monthly calendars ensuring consistent brand voice.', icon: icons.calendar },
  { title: 'Reels & Short-form Content', desc: 'Eye-catching short videos designed for maximum engagement.', icon: icons.reels },
  { title: 'Copywriting & Captions', desc: 'Persuasive, on-brand copy that drives conversations.', icon: icons.copywriting },
  { title: 'Creative Content Ideas', desc: 'Fresh, innovative concepts that make your brand stand out.', icon: icons.ideas },
  { title: 'Audience & Competitor Research', desc: 'Data-driven insights to refine targeting and positioning.', icon: icons.research },
  { title: 'Digital Marketing', desc: 'Strategic campaigns that convert audiences into loyal customers.', icon: icons.marketing },
  { title: 'AI-assisted Content Development', desc: 'Leveraging cutting-edge AI tools for faster, smarter content.', icon: icons.ai },
]
</script>

<style scoped>
.skills {
  background: linear-gradient(180deg, var(--color-bg) 0%, rgba(232, 224, 220, 0.2) 50%, var(--color-bg) 100%);
}

.skills-header {
  text-align: center;
  margin-bottom: 4rem;
}

.skills-header .section-subtitle {
  margin: 0 auto;
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.skill-card {
  background: var(--color-bg);
  border: 1px solid var(--color-neutral);
  border-radius: 14px;
  padding: 2rem;
  transition: all 0.4s ease;
  cursor: default;
}

.skill-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(139, 111, 114, 0.08);
}

.skill-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(196, 168, 176, 0.15), rgba(139, 111, 114, 0.1));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
  color: var(--color-deep);
}

.skill-icon :deep(svg) {
  width: 22px;
  height: 22px;
}

.skill-title {
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 0.6rem;
  color: var(--color-text);
}

.skill-desc {
  font-size: 0.875rem;
  color: #8a7e7e;
  line-height: 1.65;
}

@media (max-width: 768px) {
  .skills-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .skill-card {
    padding: 1.5rem;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .skills-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
