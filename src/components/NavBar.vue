<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useLocale } from '../composables/useLocale.js'
import IconGlyph from './IconGlyph.vue'
import { ui } from '../data/icons.js'

const { t, isAr, toggleLocale } = useLocale()

const isScrolled = ref(false)
const menuOpen = ref(false)
const active = ref('')

const links = [
  { key: 'about', href: '#about' },
  { key: 'skills', href: '#skills' },
  { key: 'work', href: '#work' },
  { key: 'approach', href: '#approach' },
  { key: 'contact', href: '#contact' },
]

const targetMap = new Map()
let observer = null

function handleScroll() {
  isScrolled.value = window.scrollY > 24
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()

  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible) active.value = `#${visible.target.id}`
    },
    { rootMargin: '-45% 0px -50% 0px', threshold: [0, 0.25, 0.5] }
  )

  links.forEach((l) => {
    const el = document.querySelector(l.href)
    if (el) {
      targetMap.set(l.href, el)
      observer.observe(el)
    }
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  if (observer) observer.disconnect()
})

function goTo(href) {
  menuOpen.value = false
  const el = document.querySelector(href)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>

<template>
  <header :class="['navbar', { scrolled: isScrolled }]">
    <div class="navbar-inner container">
      <a href="#hero" class="nav-brand" @click.prevent="goTo('#hero')" :aria-label="t('nav.backHome')">
        <span class="brand-mark" aria-hidden="true">S<span class="brand-dot">.</span></span>
        <span class="brand-word">Shymaa Raouf</span>
      </a>

      <nav class="nav-links" aria-label="Primary">
        <a
          v-for="link in links"
          :key="link.href"
          :href="link.href"
          class="nav-link"
          :class="{ active: active === link.href }"
          @click.prevent="goTo(link.href)"
        >
          {{ t(`nav.${link.key}`) }}
        </a>
      </nav>

      <div class="nav-actions">
        <button
          class="lang-toggle"
          type="button"
          :aria-label="t('nav.switchLang')"
          @click="toggleLocale"
        >
          {{ isAr ? 'EN' : 'العربية' }}
        </button>

        <button
          class="nav-toggle"
          type="button"
          :aria-label="menuOpen ? t('nav.closeMenu') : t('nav.openMenu')"
          :aria-expanded="menuOpen"
          @click="menuOpen = !menuOpen"
        >
          <IconGlyph :path="menuOpen ? ui.close : ui.menu" :size="22" />
        </button>
      </div>
    </div>

    <Transition name="panel">
      <Teleport to="body">
        <div v-if="menuOpen" class="mobile-panel">
          <nav class="mobile-links" aria-label="Mobile">
            <a
              v-for="(link, i) in links"
              :key="link.href"
              :href="link.href"
              class="mobile-link"
              :style="{ transitionDelay: `${60 + i * 40}ms` }"
              @click.prevent="goTo(link.href)"
            >
              <span class="mobile-index">{{ String(i + 1).padStart(2, '0') }}</span>
              {{ t(`nav.${link.key}`) }}
            </a>
          </nav>
          <div class="mobile-panel-footer">
            <button class="lang-toggle" type="button" @click="toggleLocale">
              {{ isAr ? 'EN' : 'العربية' }}
            </button>
          </div>
        </div>
      </Teleport>
    </Transition>
  </header>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(244, 238, 228, 0.55);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid transparent;
  transition: background-color 0.4s var(--ease), border-color 0.4s var(--ease);
}

.navbar.scrolled {
  background: rgba(244, 238, 228, 0.88);
  border-bottom-color: var(--hairline);
}

.navbar-inner {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1.5rem;
  height: 72px;
}

.nav-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.9rem;
  justify-self: start;
}

.brand-mark {
  font-family: var(--font-display);
  font-size: 1.7rem;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--ink);
}

.brand-dot {
  color: var(--accent);
}

.brand-word {
  font-family: var(--font-display);
  font-size: 1.02rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-2);
}

.nav-links {
  display: flex;
  gap: 0;
}

.nav-link {
  position: relative;
  font-size: 0.78rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-2);
  padding: 0.4rem 0.9rem;
  transition: color 0.25s ease;
}

.nav-link::after {
  content: '';
  position: absolute;
  left: 0.9rem;
  right: 0.9rem;
  bottom: 0;
  height: 1.5px;
  background: var(--accent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.35s var(--ease);
}

[dir='rtl'] .nav-link::after {
  transform-origin: right;
}

.nav-link:hover,
.nav-link.active {
  color: var(--ink);
}

.nav-link.active::after {
  transform: scaleX(1);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-self: end;
}

.lang-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink);
  padding: 0.45rem 0.95rem;
  border: 1px solid var(--hairline);
  border-radius: 100px;
  transition: border-color 0.25s ease, color 0.25s ease, background-color 0.25s ease;
}

.lang-toggle::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
}

.lang-toggle:hover {
  border-color: var(--accent);
  color: var(--accent);
}

[dir='rtl'] .lang-toggle {
  letter-spacing: 0.02em;
}

.nav-toggle {
  display: none;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  color: var(--ink);
  border: 1px solid var(--hairline);
  border-radius: 50%;
}

@media (max-width: 900px) {
  .navbar-inner {
    grid-template-columns: 1fr auto;
    height: 64px;
  }

  .nav-links {
    display: none;
  }

  .nav-toggle {
    display: inline-flex;
  }
}

.mobile-panel {
  position: fixed;
  inset: 64px 0 0 0;
  background: var(--paper);
  z-index: 90;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: var(--gutter);
  border-top: 1px solid var(--hairline);
}

.mobile-links {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.mobile-link {
  display: flex;
  align-items: baseline;
  gap: 1.25rem;
  font-family: var(--font-display-rtl, var(--font-display));
  font-size: clamp(1.9rem, 8vw, 2.8rem);
  font-weight: 500;
  color: var(--ink);
  padding-block: 0.7rem;
  border-bottom: 1px solid var(--hairline);
}

.mobile-index {
  font-size: 0.72rem;
  font-family: var(--font-body);
  font-weight: 600;
  letter-spacing: 0.2em;
  color: var(--accent);
}

.mobile-panel-footer {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-start;
}

.panel-enter-active,
.panel-leave-active {
  transition: opacity 0.35s var(--ease);
}

.panel-enter-from,
.panel-leave-to {
  opacity: 0;
}

.panel-enter-active .mobile-link,
.panel-leave-active .mobile-link {
  transition: transform 0.35s var(--ease), opacity 0.35s var(--ease);
}

.panel-enter-from .mobile-link,
.panel-leave-to .mobile-link {
  opacity: 0;
  transform: translateY(14px);
}
</style>