import { defineConfig } from 'vitest/config'

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  test: {
    environment: 'node',
    include: ['scripts/js-packages-release/tests/**/*.test.ts'],
  },
})
