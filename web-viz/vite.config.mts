import path from 'path'
import react from '@vitejs/plugin-react'
import lostCss from 'lost'
import postCssApply from 'postcss-apply'
import postColorModFunction from 'postcss-color-mod-function'
import postCssImport from 'postcss-import'
import postCssPresetEnv from 'postcss-preset-env'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist',
  },
  plugins: [
    react({
      include: '**/*.tsx',
      babel: {
        configFile: true,
      },
    }),
  ],
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020',
    },
  },
  css: {
    postcss: {
      plugins: [
        postCssImport({ root: 'src/' }),
        postCssApply(),
        postColorModFunction(),
        postCssPresetEnv({ stage: 0 }),
        lostCss(),
      ],
    },
  },
  define: {
    global: 'globalThis',
    _NODE_ENV_: JSON.stringify(process.env.NODE_ENV),
  },
  resolve: {
    alias: [
      {
        find: '@opentrons/components/styles/global',
        replacement: path.resolve('../components/src/styles/global.css'),
      },
      {
        find: '@opentrons/components/styles',
        replacement: path.resolve('../components/src/index.module.css'),
      },
      {
        find: '@opentrons/components',
        replacement: path.resolve('../components/src/index.ts'),
      },
      {
        find: '@opentrons/shared-data',
        replacement: path.resolve('../shared-data/js/index.ts'),
      },
      {
        find: '@opentrons/step-generation',
        replacement: path.resolve('../step-generation/src/index.ts'),
      },
      {
        find: '/web-viz',
        replacement: path.resolve('./src'),
      },
    ],
  },
  server: {
    port: 5179,
  },
})
