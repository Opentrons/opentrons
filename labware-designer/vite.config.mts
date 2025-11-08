import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import postCssImport from 'postcss-import'
import postCssApply from 'postcss-apply'
import postColorModFunction from 'postcss-color-mod-function'
import postCssPresetEnv from 'postcss-preset-env'
import lostCss from 'lost'

export default defineConfig({
  build: {
    // Relative to the root
    outDir: 'dist',
  },
  plugins: [
    react({
      include: '**/*.tsx',
      babel: {
        // Use babel.config.js files
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
    // NOTE: For security, only include environment variables here if they're explicitly allowlisted.
    global: 'globalThis',
    _NODE_ENV_: JSON.stringify(process.env.NODE_ENV),
  },
  resolve: {
    alias: {
      // todo(mm, 2025-10-27): These cross-project aliases cause trouble like
      // files being processed with the wrong config (the config from the
      // consuming project vs. the config from the source project).
      // Can these be replaced with regular package.json dependencies?
      '@opentrons/components/styles': path.resolve('../components/src/index.module.css'),
      '@opentrons/components': path.resolve('../components/src/index.ts'),
      '@opentrons/shared-data': path.resolve('../shared-data/js/index.ts'),
      '@opentrons/step-generation': path.resolve('../step-generation/src/index.ts'),
    },
  },
})
