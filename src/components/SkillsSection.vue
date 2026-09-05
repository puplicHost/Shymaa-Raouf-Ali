<script setup>
import { useScrollReveal } from '../composables/useScrollReveal'
import { useLocale } from '../composables/useLocale.js'

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

      <div class="skills-grid fade-in">
        <article
          v-for="(skill, index) in skills"
          :key="skill.en"
          class="skill-card"
        >
          <span class="skill-no" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
          <h3 class="skill-title">{{ isAr ? skill.ar : skill.en }}</h3>
          <p class="skill-desc">{{ isAr ? skill.arDesc : skill.enDesc }}</p>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.skills {
  background: var(--surface);
  border-top: 1px solid var(--border);
}

.skills-head {
  margin-bottom: clamp(2.5rem, 5vw, 4.5rem);
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}

.skill-card {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  transition: border-color 0.3s ease, transform 0.3s var(--ease);
}

.skill-card:hover {
  border-color: var(--accent);
  transform: translateY(-3px);
}

.skill-no {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  color: var(--cyan);
}

.skill-title {
  font-size: clamp(1.05rem, 1.8vw, 1.25rem);
  font-weight: 600;
  color: var(--text);
  line-height: 1.3;
}

.skill-desc {
  color: var(--muted);
  font-size: 0.88rem;
  line-height: 1.7;
}

@media (max-width: 1024px) {
  .skills-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .skills-grid {
    grid-template-columns: 1fr;
  }

  .skill-card {
    padding: 22px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skill-card {
    transition: none;
  }

  .skill-card:hover {
    transform: none;
  }
}
</style>
