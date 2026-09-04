<template>
  <section id="contact" class="contact">
    <div class="container">
      <div class="contact-inner fade-in">
        <span class="section-label">Get in Touch</span>
        <h2 class="contact-title">Let's Work Together</h2>
        <p class="contact-subtitle">
          Looking for a Social Media Specialist who combines creativity with strategy? Let's talk.
        </p>

        <div class="contact-links">
          <a :href="`mailto:${email}`" class="contact-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
            <span>Email</span>
          </a>

          <a :href="linkedin" target="_blank" rel="noopener noreferrer" class="contact-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
              <circle cx="4" cy="4" r="2"/>
            </svg>
            <span>LinkedIn</span>
          </a>

          <a :href="`https://wa.me/${whatsapp}`" target="_blank" rel="noopener noreferrer" class="contact-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
            </svg>
            <span>WhatsApp</span>
          </a>
        </div>

        <div class="contact-details">
          <a :href="`mailto:${email}`" class="detail-link">{{ email }}</a>
          <span class="detail-sep">·</span>
          <a :href="`tel:${phone}`" class="detail-link">{{ phoneFormatted }}</a>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useScrollReveal } from '../composables/useScrollReveal'

useScrollReveal()

const email = 'raoufshimaa587@gmail.com'
const phone = '+201282354052'
const phoneFormatted = '+20 128 235 4052'
const whatsapp = '201282354052'
const linkedin = 'https://www.linkedin.com/in/shymaa-raouf-ali'
</script>

<style scoped>
.contact {
  background: var(--color-bg);
  padding: var(--section-padding) 0 6rem;
}

.contact-inner {
  text-align: center;
  max-width: 640px;
  margin: 0 auto;
}

.contact-title {
  font-size: clamp(2.25rem, 5vw, 3.75rem);
  font-weight: 300;
  margin-bottom: 1.25rem;
}

.contact-subtitle {
  font-size: 1.05rem;
  color: #6b6262;
  line-height: 1.8;
  margin-bottom: 3rem;
}

.contact-links {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2.5rem;
  flex-wrap: wrap;
}

.contact-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.85rem 1.75rem;
  border: 1.5px solid var(--color-neutral);
  border-radius: 100px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
  transition: all 0.35s ease;
}

.contact-btn:hover {
  border-color: var(--color-primary);
  background: rgba(196, 168, 176, 0.08);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(139, 111, 114, 0.1);
}

.contact-btn svg {
  color: var(--color-deep);
}

.contact-details {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.detail-link {
  font-size: 0.85rem;
  color: #8a7e7e;
  transition: color 0.3s ease;
}

.detail-link:hover {
  color: var(--color-deep);
}

.detail-sep {
  color: var(--color-neutral);
}

@media (max-width: 768px) {
  .contact-links {
    flex-direction: column;
    align-items: center;
  }

  .contact-btn {
    width: 100%;
    max-width: 260px;
    justify-content: center;
  }
}
</style>
