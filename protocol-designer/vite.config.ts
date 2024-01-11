import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import postCssApply from 'postcss-apply'
import postCssImport from 'postcss-import'
import postCssPresetEnv from 'postcss-preset-env'

export default defineConfig({
  build: {
    // Relative to the root
    outDir: 'dist',
  },
  plugins: [react()],
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020',
    },
    include: ['@opentrons/shared-data'],
  },
  css: {
    postcss: {
      plugins: [
        postCssImport({
          root: 'src/',
        }),
        postCssApply(),
        postCssPresetEnv({
          stage: 0,
          features: {
            'logical-properties-and-values': false,
            'prefers-color-scheme-query': false,
            'gap-properties': false,
            'custom-properties': false,
            'place-properties': false,
            'not-pseudo-class': false,
            'focus-visible-pseudo-class': false,
            'focus-within-pseudo-class': false,
            'color-functional-notation': false,
          },
        }),
      ],
    },
  },
  define: {
    'process.env': process.env,
    global: 'window',
  },
  resolve: {
    alias: {
      '@opentrons/components/styles': `@opentrons/components/src/index.module.css`,
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
