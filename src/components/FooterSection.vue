<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-inner">
        <div class="footer-brand">
          <div class="footer-logo">
            <span class="logo-mark">S</span>
            <span class="logo-text">Shymaa Raouf Ali</span>
          </div>
          <p class="footer-tagline">Creative Thinking. Strategic Purpose.</p>
        </div>

        <div class="footer-links">
          <a href="#about">About</a>
          <a href="#skills">Skills</a>
          <a href="#work">Work</a>
          <a href="#approach">Approach</a>
          <a href="#contact">Contact</a>
        </div>

        <div class="footer-bottom">
          <span class="footer-copy">&copy; {{ year }} Shymaa Raouf Ali. All rights reserved.</span>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
const year = new Date().getFullYear()
</script>

<style scoped>
.footer {
  background: var(--color-text);
  color: rgba(250, 247, 244, 0.6);
  padding: 4rem 0 2rem;
}

.footer-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2.5rem;
}

.footer-brand {
  text-align: center;
}

.footer-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  margin-bottom: 0.75rem;
}

.footer-logo .logo-mark {
  width: 32px;
  height: 32px;
  background: var(--color-primary);
  color: var(--color-bg);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 600;
}

.footer-logo .logo-text {
  font-family: var(--font-heading);
  font-size: 1.15rem;
  font-weight: 400;
  color: rgba(250, 247, 244, 0.85);
}

.footer-tagline {
  font-size: 0.85rem;
  font-style: italic;
  opacity: 0.5;
}

.footer-links {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  justify-content: center;
}

.footer-links a {
  font-size: 0.8rem;
  letter-spacing: 0.06em;
  transition: color 0.3s ease;
}

.footer-links a:hover {
  color: var(--color-primary);
}

.footer-bottom {
  padding-top: 2rem;
  border-top: 1px solid rgba(250, 247, 244, 0.08);
  width: 100%;
  text-align: center;
}

.footer-copy {
  font-size: 0.75rem;
  opacity: 0.4;
}
</style>
