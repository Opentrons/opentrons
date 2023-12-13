import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  build: {
    // Relative to the root
    outDir: 'dist',
  },
  plugins: [react()],
  css: {
    postcss: {
      plugins: [],
    },
  },
  resolve: {
    alias: {
      '@opentrons/components/styles': `@opentrons/components/src/index.css`,
      '@opentrons/components': `@opentrons/components/src/index.ts`,
      '@opentrons/shared-data': `@opentrons/shared-data/js/index.ts`,
      '@opentrons/step-generation': `@opentrons/step-generation/src/index.ts`,
      '@opentrons/api-client': `${path.resolve(__dirname, 'src')}/index.ts`,
      '@opentrons/react-api-client': `${path.resolve(
        __dirname,
        'src'
      )}/index.ts`,
    },
  },
})
