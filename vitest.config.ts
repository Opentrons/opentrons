/// <reference types="vitest" />
/// <reference types="vite/client" />
import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom'
  },
  resolve: {
    alias: {
      '@opentrons/components/styles': path.resolve('./components/src/index.module.css'),
      '@opentrons/components': path.resolve('./components/src/index.ts'),
      '@opentrons/shared-data': path.resolve('./shared-data/js/index.ts'),
      '@opentrons/step-generation': path.resolve('./step-generation/src/index.ts'),
    },
  },
})

