<template>
  <nav :class="['navbar', { scrolled: isScrolled }]">
    <div class="navbar-inner container">
      <a href="#" class="nav-logo">
        <span class="logo-mark">S</span>
        <span class="logo-text">Shymaa</span>
      </a>

      <button class="nav-toggle" @click="menuOpen = !menuOpen" :aria-label="menuOpen ? 'Close menu' : 'Open menu'">
        <span :class="['bar', { open: menuOpen }]"></span>
      </button>

      <ul :class="['nav-links', { open: menuOpen }]">
        <li v-for="link in links" :key="link.href">
          <a :href="link.href" @click="menuOpen = false">{{ link.label }}</a>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const isScrolled = ref(false)
const menuOpen = ref(false)

const links = [
  { label: 'About', href: '#about' },
  { label: 'Skills', href: '#skills' },
  { label: 'Work', href: '#work' },
  { label: 'Approach', href: '#approach' },
  { label: 'Contact', href: '#contact' },
]

const handleScroll = () => {
  isScrolled.value = window.scrollY > 50
}

onMounted(() => window.addEventListener('scroll', handleScroll))
onUnmounted(() => window.removeEventListener('scroll', handleScroll))
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 1.25rem 0;
  transition: all 0.4s ease;
}

.navbar.scrolled {
  background: rgba(250, 247, 244, 0.92);
  backdrop-filter: blur(12px);
  padding: 0.75rem 0;
  box-shadow: 0 1px 20px rgba(0, 0, 0, 0.04);
}

.navbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.logo-mark {
  width: 36px;
  height: 36px;
  background: var(--color-primary);
  color: var(--color-bg);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-heading);
  font-size: 1.1rem;
  font-weight: 600;
}

.logo-text {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 500;
  letter-spacing: 0.02em;
}

.nav-links {
  display: flex;
  gap: 2.25rem;
}

.nav-links a {
  font-size: 0.875rem;
  font-weight: 400;
  letter-spacing: 0.04em;
  color: var(--color-text);
  position: relative;
  transition: color 0.3s ease;
}

.nav-links a::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 1.5px;
  background: var(--color-primary);
  transition: width 0.3s ease;
}

.nav-links a:hover {
  color: var(--color-deep);
}

.nav-links a:hover::after {
  width: 100%;
}

.nav-toggle {
  display: none;
  width: 28px;
  height: 20px;
  position: relative;
}

.bar,
.bar::before,
.bar::after {
  display: block;
  width: 100%;
  height: 2px;
  background: var(--color-text);
  border-radius: 2px;
  transition: all 0.3s ease;
}

.bar {
  position: relative;
}

.bar::before,
.bar::after {
  content: '';
  position: absolute;
  left: 0;
}

.bar::before { top: -7px; }
.bar::after { bottom: -7px; }

.bar.open {
  background: transparent;
}

.bar.open::before {
  top: 0;
  transform: rotate(45deg);
}

.bar.open::after {
  bottom: 0;
  transform: rotate(-45deg);
}

@media (max-width: 768px) {
  .nav-toggle {
    display: block;
  }

  .nav-links {
    position: fixed;
    top: 0;
    right: -100%;
    width: 75%;
    max-width: 320px;
    height: 100vh;
    background: var(--color-bg);
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 2rem;
    transition: right 0.4s ease;
    box-shadow: -10px 0 40px rgba(0, 0, 0, 0.08);
  }

  .nav-links.open {
    right: 0;
  }

  .nav-links a {
    font-size: 1.1rem;
  }
}
</style>
