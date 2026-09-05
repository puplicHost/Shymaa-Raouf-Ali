<script setup>
import { useLocale } from '../composables/useLocale.js'

const { t } = useLocale()
const year = new Date().getFullYear()

const links = [
  { key: 'about', href: '#about' },
  { key: 'skills', href: '#skills' },
  { key: 'work', href: '#work' },
  { key: 'approach', href: '#approach' },
  { key: 'certifications', href: '#certifications' },
  { key: 'contact', href: '#contact' },
]
</script>

<template>
  <footer class="footer">
    <div class="container footer-inner">
      <div class="footer-top">
        <div class="footer-brand">
          <span class="brand-mark">S<span class="brand-dot">.</span></span>
          <span class="brand-word">Shymaa Raouf Ali</span>
          <span class="tagline">{{ t('footer.tagline') }}</span>
        </div>

        <nav class="footer-links" aria-label="Footer">
          <a v-for="link in links" :key="link.href" :href="link.href">
            {{ t(`nav.${link.key}`) }}
          </a>
        </nav>
      </div>

      <div class="footer-bottom">
        <span>&copy; {{ year }} Shymaa Raouf Ali. {{ t('footer.rights') }}</span>
        <span class="built-note">{{ t('footer.built') }} <a href="https://portholiohub.pages.dev/" target="_blank" rel="noopener noreferrer">PortholioHub</a></span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: var(--bg);
  border-top: 1px solid var(--border);
  padding-block: 2.25rem 1.75rem;
}

.footer-inner {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.footer-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  flex-wrap: wrap;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.brand-mark {
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 700;
  line-height: 1;
}

.brand-dot {
  color: var(--accent);
}

.brand-word {
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
}

.tagline {
  font-size: 0.78rem;
  font-style: italic;
  color: var(--muted);
  padding-inline-start: 1rem;
  border-inline-start: 1px solid var(--border-strong);
}

.footer-links {
  display: flex;
  gap: clamp(1rem, 3vw, 2rem);
  flex-wrap: wrap;
}

.footer-links a {
  font-size: 0.76rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  transition: color 0.25s ease;
}

.footer-links a:hover {
  color: var(--accent);
}

.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  border-top: 1px solid var(--border);
  padding-top: 1.4rem;
  font-size: 0.76rem;
  color: var(--muted);
}

.built-note::before {
  content: '—';
  margin-inline-end: 0.4rem;
  color: var(--accent);
}

.built-note a {
  color: var(--accent);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.25s ease;
}

.built-note a:hover {
  color: var(--text);
  text-decoration: underline;
}

@media (max-width: 560px) {
  .tagline {
    display: none;
  }
}
</style>
