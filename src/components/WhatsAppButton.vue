<script setup>
import { useLocale } from '../composables/useLocale.js'
import IconGlyph from './IconGlyph.vue'
import { brand } from '../data/icons.js'

const { isAr } = useLocale()
const whatsapp = '201282354052'
</script>

<template>
  <a
    :href="`https://wa.me/${whatsapp}`"
    target="_blank"
    rel="noopener noreferrer"
    class="whatsapp-btn"
    :aria-label="isAr ? 'تواصل مع شيماء عبر واتساب' : 'Chat with Shymaa on WhatsApp'"
  >
    <IconGlyph :path="brand.whatsapp" :size="24" />
  </a>
</template>

<style scoped>
.whatsapp-btn {
  position: fixed;
  bottom: 5.5rem;
  right: 1.75rem;
  z-index: 98;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #25D366;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(37, 211, 102, 0.35);
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

[dir='rtl'] .whatsapp-btn {
  right: auto;
  left: 1.75rem;
}

.whatsapp-btn:hover {
  transform: translateY(-3px) scale(1.08);
  box-shadow: 0 8px 24px rgba(37, 211, 102, 0.45);
}

@media (max-width: 480px) {
  .whatsapp-btn {
    bottom: 4.75rem;
    right: 1.1rem;
    width: 48px;
    height: 48px;
  }

  [dir='rtl'] .whatsapp-btn {
    right: auto;
    left: 1.1rem;
  }
}
</style>
