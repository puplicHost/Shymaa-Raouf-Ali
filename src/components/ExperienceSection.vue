<script setup>
import { useScrollReveal } from '../composables/useScrollReveal'
import { useLocale } from '../composables/useLocale.js'

useScrollReveal()

const { t, isAr } = useLocale()

const jobs = [
  {
    roleEn: 'Social Media & Content Creator',
    roleAr: 'أخصائية سوشيال ميديا وصانعة محتوى',
    companyEn: 'Tamiyouz Company',
    companyAr: 'شركة تميّز',
    periodEn: 'Apr 2025 – Present',
    periodAr: 'أبريل ٢٠٢٥ – حتى الآن',
    metaEn: 'Saudi market focus',
    metaAr: 'تركيز على السوق السعودي',
    current: true,
    pointsEn: [
      'Manage brand accounts across Facebook, Instagram, TikTok, Snapchat, X and LinkedIn',
      'Develop content strategies and monthly content calendars',
      'Write social copy, Reels scripts, creative concepts and content ideas',
      'Analyze reach, engagement and audience insights, adjusting strategy by behavior and trends',
      'Leverage Generative AI for ideation, research, copywriting and development',
      'Adapt content to Saudi cultural context and market trends',
    ],
    pointsAr: [
      'إدارة حسابات العلامات عبر فيسبوك وإنستجرام وتيك توك وسناب شات وإكس ولينكدإن',
      'تطوير استراتيجيات المحتوى وتقويمات المحتوى الشهرية',
      'كتابة النصوص وسكريبتات الريلز والأفكار والمفاهيم الإبداعية',
      'تحليل الوصول والتفاعل وسلوك الجمهور وتعديل الاستراتيجية حسب الترندات',
      'استخدام أدوات الذكاء الاصطناعي التوليدي في توليد الأفكار والبحث والكتابة والتطوير',
      'تكييف المحتوى مع الثقافة السعودية واتجاهات السوق',
    ],
  },
  {
    roleEn: 'French Language Teacher',
    roleAr: 'مدرّسة لغة فرنسية',
    companyEn: '',
    companyAr: '',
    periodEn: '2023 – 2024',
    periodAr: '٢٠٢٣ – ٢٠٢٤',
    metaEn: 'Education',
    metaAr: 'التعليم',
    current: false,
    pointsEn: [
      'Developed structured lesson plans and interactive learning materials',
      'Used digital tools and modern teaching methods',
    ],
    pointsAr: [
      'إعداد خطط دروس منظمة ومواد تعليمية تفاعلية',
      'استخدام الأدوات الرقمية وطرق التدريس الحديثة',
    ],
  },
]
</script>

<template>
  <section id="experience" class="experience">
    <div class="container">
      <div class="section-head fade-in">
        <span class="eyebrow">{{ t('experience.label') }}</span>
        <h2 class="section-title">{{ t('experience.title') }}</h2>
        <p class="section-subtitle">{{ t('experience.subtitle') }}</p>
      </div>

      <div class="timeline fade-in">
        <article
          v-for="job in jobs"
          :key="job.roleEn"
          class="job-card"
          :class="{ current: job.current }"
        >
          <div class="job-top">
            <div class="job-head">
              <h3 class="job-role">{{ isAr ? job.roleAr : job.roleEn }}</h3>
              <p v-if="isAr ? job.companyAr : job.companyEn" class="job-company">
                {{ isAr ? job.companyAr : job.companyEn }}
              </p>
            </div>
            <div class="job-badges">
              <span v-if="job.current" class="badge badge-current">
                {{ t('experience.present') }}
              </span>
              <span class="badge">{{ isAr ? job.periodAr : job.periodEn }}</span>
            </div>
          </div>

          <p class="job-meta">{{ isAr ? job.metaAr : job.metaEn }}</p>

          <ul class="job-points">
            <li v-for="point in (isAr ? job.pointsAr : job.pointsEn)" :key="point">
              {{ point }}
            </li>
          </ul>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.experience {
  background: var(--surface);
  border-top: 1px solid var(--border);
}

.timeline {
  display: grid;
  gap: 1.25rem;
}

.job-card {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: clamp(1.5rem, 3vw, 2.25rem);
  position: relative;
  transition: border-color 0.3s ease, transform 0.3s var(--ease);
}

.job-card:hover {
  border-color: var(--accent);
  transform: translateY(-3px);
}

.job-card.current {
  border-color: var(--accent);
}

.job-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.25rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}

.job-role {
  font-size: clamp(1.2rem, 2.4vw, 1.6rem);
  font-weight: 600;
  line-height: 1.3;
}

.job-company {
  color: var(--accent);
  font-size: 0.95rem;
  font-weight: 600;
  margin-top: 0.3rem;
}

.job-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.badge {
  display: inline-flex;
  align-items: center;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  border: 1px solid var(--border-strong);
  border-radius: 9999px;
  padding: 0.4rem 0.9rem;
  white-space: nowrap;
}

[dir='rtl'] .badge {
  letter-spacing: 0.02em;
}

.badge-current {
  color: var(--cyan);
  border-color: var(--cyan);
  background: var(--cyan-soft);
}

.badge-current::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--cyan);
  margin-inline-end: 0.5rem;
}

.job-meta {
  font-size: 0.76rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 1rem;
}

[dir='rtl'] .job-meta {
  letter-spacing: 0.02em;
}

.job-points {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.job-points li {
  position: relative;
  color: var(--muted);
  font-size: 0.92rem;
  line-height: 1.75;
  padding-inline-start: 1.25rem;
}

.job-points li::before {
  content: '';
  position: absolute;
  inset-inline-start: 0;
  top: 0.72em;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
}

@media (max-width: 600px) {
  .job-top {
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  .job-card {
    transition: none;
  }

  .job-card:hover {
    transform: none;
  }
}
</style>
