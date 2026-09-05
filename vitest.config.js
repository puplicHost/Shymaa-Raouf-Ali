import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/dom-stub.js'],
    include: ['tests/**/*.test.js'],
  },
})