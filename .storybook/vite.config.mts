/// <reference types="vitest" />
/// <reference types="vite/client" />

import path from 'path'
import react from '@vitejs/plugin-react'
import lostCss from 'lost'
import postcssApply from 'postcss-apply'
import postColorModFunction from 'postcss-color-mod-function'
import postCssImport from 'postcss-import'
import postCssPresetEnv from 'postcss-preset-env'
import { defineConfig } from 'vite'

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
    exclude: ['node_modules'],
  },
  css: {
    postcss: {
      plugins: [
        postCssImport({ root: 'src/' }),
        postcssApply(),
        postColorModFunction(),
        postCssPresetEnv({ stage: 0 }),
        lostCss(),
      ],
    },
  },
  define: {
    // These defines mimic the ones set in various project-local vite.config.mts files.
    // NOTE: For security, only include environment variables here if they're explicitly allowlisted.
    _FF_ENV_VARS_: {},
    _NODE_ENV_: JSON.stringify(process.env.NODE_ENV),
    _OT_AI_CLIENT_MIXPANEL_ID_: JSON.stringify(
      process.env.OT_AI_CLIENT_MIXPANEL_ID
    ),
    _OT_APP_MIXPANEL_ID_: JSON.stringify(process.env.OT_APP_MIXPANEL_ID),
    _OT_SENTRY_DSN_: JSON.stringify(process.env.OT_SENTRY_DSN),
    _OT_LL_MIXPANEL_DEV_ID_: JSON.stringify(process.env.OT_LL_MIXPANEL_DEV_ID),
    _OT_LL_MIXPANEL_ID_: JSON.stringify(process.env.OT_LL_MIXPANEL_ID),
    _OT_PD_BUILD_DATE_: JSON.stringify(process.env.OT_PD_BUILD_DATE),
    _OT_PD_MIXPANEL_DEV_ID_: JSON.stringify(process.env.OT_PD_MIXPANEL_DEV_ID),
    _OT_PD_MIXPANEL_ID_: JSON.stringify(process.env.OT_PD_MIXPANEL_ID),
    _OT_PD_SENTRY_DEV_DSN_: JSON.stringify(process.env.OT_PD_SENTRY_DEV_DSN),
    _OT_PD_SENTRY_DSN_: JSON.stringify(process.env.OT_PD_SENTRY_DSN),
    _OT_PD_VERSION_: JSON.stringify(process.env.OT_PD_VERSION),
    'process.env.NODE_DEBUG': JSON.stringify(process.env.NODE_DEBUG),
    global: 'globalThis',
  },
  resolve: {
    alias: {
      // todo(mm, 2025-10-27): These cross-project aliases cause trouble like
      // files being processed with the wrong config (the config from the
      // consuming project vs. the config from the source project).
      // Can these be replaced with regular package.json dependencies?
      '@opentrons/components/styles': path.resolve(
        './components/src/index.module.css'
      ),
      '@opentrons/components': path.resolve('./components/src/index.ts'),
      '@opentrons/shared-data/pipette/fixtures/name': path.resolve(
        './shared-data/pipette/fixtures/name/index.ts'
      ),
      '@opentrons/shared-data/labware/fixtures/1': path.resolve(
        './shared-data/labware/fixtures/1/index.ts'
      ),
      '@opentrons/shared-data/labware/fixtures/2': path.resolve(
        './shared-data/labware/fixtures/2/index.ts'
      ),
      '@opentrons/shared-data/labware/fixtures/3': path.resolve(
        './shared-data/labware/fixtures/3/index.ts'
      ),
      '@opentrons/shared-data': path.resolve('./shared-data/js/index.ts'),
      '@opentrons/step-generation': path.resolve(
        './step-generation/src/index.ts'
      ),
      '/app/': path.resolve('./app/src/') + '/',
      '/ai-client/': path.resolve('./opentrons-ai-client/src/') + '/',
      '/protocol-designer/': path.resolve('./protocol-designer/src/') + '/',
    },
  },
})
