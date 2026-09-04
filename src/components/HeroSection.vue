<template>
  <section id="hero" class="hero">
    <div class="hero-bg">
      <div class="hero-gradient"></div>
      <div class="hero-orb hero-orb-1"></div>
      <div class="hero-orb hero-orb-2"></div>
    </div>

    <div class="hero-content container">
      <div class="hero-text" :class="{ visible: mounted }">
        <span class="hero-label">Social Media Specialist & Content Creator</span>
        <h1 class="hero-name">
          <span class="name-line">Shymaa</span>
          <span class="name-line name-accent">Raouf Ali</span>
        </h1>
        <p class="hero-tagline">Creative Thinking. Strategic Purpose.</p>
        <div class="hero-actions">
          <a href="#work" class="btn btn-primary">Explore My Work</a>
          <a href="#contact" class="btn btn-outline">Let's Talk</a>
        </div>
      </div>

      <div class="hero-visual" :class="{ visible: mounted }">
        <div class="visual-frame">
          <div class="frame-accent"></div>
          <div class="frame-content">
            <span class="initials">SR</span>
          </div>
        </div>
      </div>
    </div>

    <div class="hero-scroll" :class="{ visible: mounted }">
      <span>Scroll</span>
      <div class="scroll-line"></div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const mounted = ref(false)

onMounted(() => {
  setTimeout(() => {
    mounted.value = true
  }, 100)
})
</script>

<style scoped>
.hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hero-gradient {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 70% 50%, rgba(196, 168, 176, 0.12) 0%, transparent 60%);
}

.hero-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
}

.hero-orb-1 {
  width: 400px;
  height: 400px;
  background: var(--color-primary);
  top: 10%;
  right: 15%;
}

.hero-orb-2 {
  width: 250px;
  height: 250px;
  background: var(--color-neutral);
  bottom: 20%;
  left: 10%;
}

.hero-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
  padding-top: 6rem;
}

.hero-text {
  opacity: 0;
  transform: translateY(40px);
  transition: all 1s cubic-bezier(0.22, 1, 0.36, 1);
}

.hero-text.visible {
  opacity: 1;
  transform: translateY(0);
}

.hero-label {
  display: inline-block;
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-deep);
  margin-bottom: 1.5rem;
  padding: 0.4rem 1rem;
  border: 1px solid var(--color-primary);
  border-radius: 100px;
}

.hero-name {
  font-size: clamp(3rem, 6vw, 5.5rem);
  font-weight: 300;
  line-height: 1.05;
  margin-bottom: 1.5rem;
}

.name-line {
  display: block;
}

.name-accent {
  color: var(--color-deep);
  font-style: italic;
}

.hero-tagline {
  font-size: 1.15rem;
  color: #6b6262;
  margin-bottom: 2.5rem;
  font-weight: 300;
  letter-spacing: 0.02em;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  padding: 0.85rem 2rem;
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  border-radius: 100px;
  transition: all 0.35s ease;
}

.btn-primary {
  background: var(--color-deep);
  color: var(--color-bg);
}

.btn-primary:hover {
  background: var(--color-text);
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(139, 111, 114, 0.25);
}

.btn-outline {
  border: 1.5px solid var(--color-primary);
  color: var(--color-deep);
}

.btn-outline:hover {
  background: var(--color-primary);
  color: var(--color-bg);
  transform: translateY(-2px);
}

.hero-visual {
  display: flex;
  justify-content: center;
  opacity: 0;
  transform: translateY(40px) scale(0.95);
  transition: all 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.3s;
}

.hero-visual.visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.visual-frame {
  width: 320px;
  height: 400px;
  position: relative;
}

.frame-accent {
  position: absolute;
  inset: -12px;
  border: 1.5px solid var(--color-primary);
  border-radius: 16px;
  opacity: 0.5;
}

.frame-content {
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, var(--color-neutral), var(--color-primary));
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.frame-content::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent 60%);
}

.initials {
  font-family: var(--font-heading);
  font-size: 5rem;
  font-weight: 300;
  color: var(--color-bg);
  opacity: 0.7;
  letter-spacing: 0.1em;
}

.hero-scroll {
  position: absolute;
  bottom: 2.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 1s ease 1.5s;
}

.hero-scroll.visible {
  opacity: 1;
}

.hero-scroll span {
  font-size: 0.7rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-deep);
  opacity: 0.6;
}

.scroll-line {
  width: 1px;
  height: 40px;
  background: var(--color-primary);
  position: relative;
  overflow: hidden;
}

.scroll-line::after {
  content: '';
  position: absolute;
  top: -100%;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--color-deep);
  animation: scrollDown 2s ease infinite;
}

@keyframes scrollDown {
  0% { top: -100%; }
  100% { top: 100%; }
}

@media (max-width: 768px) {
  .hero-content {
    grid-template-columns: 1fr;
    text-align: center;
    padding-top: 5rem;
  }

  .hero-actions {
    justify-content: center;
  }

  .hero-visual {
    order: -1;
  }

  .visual-frame {
    width: 220px;
    height: 280px;
  }

  .initials {
    font-size: 3.5rem;
  }

  .hero-scroll {
    display: none;
  }
}
</style>
