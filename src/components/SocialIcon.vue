<script setup>
import IconGlyph from './IconGlyph.vue'

defineProps({
  href: { type: String, required: true },
  label: { type: String, required: true },
  path: { type: String, required: true },
  external: { type: Boolean, default: true },
})
</script>

<template>
  <a
    class="social-icon"
    :href="href"
    :aria-label="label"
    :target="external ? '_blank' : undefined"
    :rel="external ? 'noopener noreferrer' : undefined"
  >
    <IconGlyph :path="path" :size="20" />
  </a>
</template>

<style scoped>
.social-icon {
  width: 40px;
  height: 40px;
  border: 1px solid var(--hairline);
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  transition: color 0.25s ease, border-color 0.25s ease, background-color 0.25s ease;
}

.social-icon:hover {
  color: var(--paper);
  background: var(--ink);
  border-color: var(--ink);
}
</style>