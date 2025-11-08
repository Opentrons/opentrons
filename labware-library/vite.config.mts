import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import postCssImport from 'postcss-import'
import postCssApply from 'postcss-apply'
import postColorModFunction from 'postcss-color-mod-function'
import postCssPresetEnv from 'postcss-preset-env'
import lostCss from 'lost'
import { cssModuleSideEffect } from './cssModuleSideEffect'

export default defineConfig({
  // this makes imports relative rather than absolute
  base: '',
  build: {
    // Relative to the root
    outDir: 'dist',
    rollupOptions: {
      input: {
        // entry points for both Labware Library and Labware Creator
        main: path.resolve(__dirname, 'index.html'),
        create: path.resolve(__dirname, 'create/index.html'),
      },
    },
  },
  plugins: [
    react({
      include: '**/*.tsx',
      babel: {
        // Use babel.config.js files
        configFile: true,
      },
    }),
    cssModuleSideEffect(), // Note for treeshake
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
    _OT_LL_MIXPANEL_ID_: JSON.stringify(process.env.OT_LL_MIXPANEL_ID),
    _OT_LL_MIXPANEL_DEV_ID_: JSON.stringify(process.env.OT_LL_MIXPANEL_DEV_ID),
    _NODE_ENV_: JSON.stringify(process.env.NODE_ENV),
    global: 'globalThis',
  },
  resolve: {
    alias: {
      // todo(mm, 2025-10-27): These cross-project aliases cause trouble like
      // files being processed with the wrong config (the config from the
      // consuming project vs. the config from the source project).
      // Can these be replaced with regular package.json dependencies?
      '@opentrons/components/styles': path.resolve(
        '../components/src/index.module.css'
      ),
      '@opentrons/components': path.resolve('../components/src/index.ts'),
      '@opentrons/shared-data': path.resolve('../shared-data/js/index.ts'),
      '@opentrons/step-generation': path.resolve(
        '../step-generation/src/index.ts'
      ),
    },
  },
  server: {
    port: 5179,
  },
})
