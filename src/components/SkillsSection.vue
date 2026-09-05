<script setup>
import { useScrollReveal } from '../composables/useScrollReveal'
import { useLocale } from '../composables/useLocale.js'
import IconGlyph from './IconGlyph.vue'
import { ui } from '../data/icons.js'

useScrollReveal()

const { t, isAr } = useLocale()

const skills = [
  {
    en: 'Social Media Management',
    ar: 'إدارة وسائل التواصل الاجتماعي',
    enDesc: 'End-to-end management of brand accounts across all major platforms.',
    arDesc: 'إدارة متكاملة لحسابات العلامات التجارية عبر كل المنصات الرئيسية.',
  },
  {
    en: 'Content Creation & Strategy',
    ar: 'إبداع المحتوى والاستراتيجية',
    enDesc: 'Visually compelling, strategically aligned content.',
    arDesc: 'محتوى جذاب بصريًا ومتوافق استراتيجيًا.',
  },
  {
    en: 'Content Calendars & Planning',
    ar: 'تقويم المحتوى والتخطيط',
    enDesc: 'Structured monthly calendars for a consistent brand voice.',
    arDesc: 'تقويمات شهرية منظمة لصوت علامة ثابت.',
  },
  {
    en: 'Reels & Short-form Content',
    ar: 'الريلز والمحتوى القصير',
    enDesc: 'Eye-catching short videos designed for maximum engagement.',
    arDesc: 'فيديوهات قصيرة لافتة مصممة لأقصى تفاعل.',
  },
  {
    en: 'Copywriting & Captions',
    ar: 'كتابة النصوص والكابشنز',
    enDesc: 'Persuasive, on-brand copy that drives conversations.',
    arDesc: 'نصوص مؤثرة وعلى هوية العلامة تحرّك الحوار.',
  },
  {
    en: 'Creative Content Ideas',
    ar: 'أفكار المحتوى الإبداعية',
    enDesc: 'Fresh, innovative concepts that make a brand stand out.',
    arDesc: 'أفكار جديدة ومبتكرة تُميّز العلامة.',
  },
  {
    en: 'Audience & Competitor Research',
    ar: 'بحث الجمهور والمنافسين',
    enDesc: 'Data-driven insights to refine targeting and positioning.',
    arDesc: 'رؤى مبنية على البيانات لضبط الاستهداف والتوضع.',
  },
  {
    en: 'Digital Marketing',
    ar: 'التسويق الرقمي',
    enDesc: 'Strategic campaigns that turn audiences into loyal customers.',
    arDesc: 'حملات استراتيجية تحوّل الجمهور إلى عملاء أوفياء.',
  },
  {
    en: 'AI-assisted Content Development',
    ar: 'تطوير المحتوى بالذكاء الاصطناعي',
    enDesc: 'Cutting-edge AI tools for faster, smarter content.',
    arDesc: 'أدوات ذكاء اصطناعي متطورة لمحتوى أسرع وأذكى.',
  },
]
</script>

<template>
  <section id="skills" class="skills">
    <div class="container">
      <div class="section-head skills-head fade-in">
        <span class="eyebrow">{{ t('skills.label') }}</span>
        <h2 class="section-title">{{ t('skills.title') }}</h2>
        <p class="section-subtitle">{{ t('skills.subtitle') }}</p>
      </div>

      <ol class="skills-list fade-in">
        <li
          v-for="(skill, index) in skills"
          :key="skill.en"
          class="skill-row"
        >
          <span class="skill-no" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
          <div class="skill-body">
            <h3 class="skill-title">{{ isAr ? skill.ar : skill.en }}</h3>
            <p class="skill-desc">{{ isAr ? skill.arDesc : skill.enDesc }}</p>
          </div>
          <span class="skill-arrow" aria-hidden="true">
            <IconGlyph :path="ui.arrowTopRight" :size="20" />
          </span>
        </li>
      </ol>
    </div>
  </section>
</template>

<style scoped>
.skills {
  background: var(--paper-3);
  border-top: 1px solid var(--hairline);
}

.skills-head {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: end;
  gap: 2rem;
}

.skills-head .section-subtitle {
  justify-self: end;
  text-align: end;
}

.skills-list {
  border-top: 2px solid var(--ink);
}

.skill-row {
  display: grid;
  grid-template-columns: clamp(2.5rem, 4vw, 4.5rem) 1fr auto;
  align-items: center;
  gap: clamp(1rem, 3vw, 2.5rem);
  padding-block: clamp(1.35rem, 2.6vw, 2rem);
  border-bottom: 1px solid var(--hairline);
  transition: background-color 0.3s ease, padding-inline 0.3s ease;
}

.skill-row:hover {
  background: var(--paper-2);
  padding-inline: 1.25rem;
}

.skill-no {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  color: var(--accent);
}

.skill-title {
  font-size: clamp(1.15rem, 2.4vw, 1.7rem);
  font-weight: 500;
  transition: color 0.25s ease, transform 0.35s var(--ease);
  transform-origin: left;
}

[dir='rtl'] .skill-title {
  transform-origin: right;
}

.skill-row:hover .skill-title {
  color: var(--accent);
  transform: translateX(6px);
}

[dir='rtl'] .skill-row:hover .skill-title {
  transform: translateX(-6px);
}

.skill-desc {
  color: var(--muted);
  font-size: 0.94rem;
  line-height: 1.7;
  margin-top: 0.35rem;
  max-width: 62ch;
}

.skill-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.3s ease, transform 0.3s var(--ease), color 0.3s ease;
}

.skill-row:hover .skill-arrow {
  opacity: 1;
  transform: translateY(0);
  color: var(--accent);
}

@media (max-width: 900px) {
  .skills-head {
    grid-template-columns: 1fr;
  }

  .skills-head .section-subtitle {
    justify-self: start;
    text-align: start;
  }
}

@media (max-width: 560px) {
  .skill-row {
    grid-template-columns: 2rem 1fr;
    gap: 0.75rem;
  }

  .skill-arrow {
    display: none;
  }

  .skill-row:hover {
    padding-inline: 0.75rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skill-row,
  .skill-title,
  .skill-arrow {
    transition: none;
  }

  .skill-row:hover .skill-title {
    transform: none;
  }

  .skill-arrow {
    opacity: 1;
    transform: none;
  }
}
</style>