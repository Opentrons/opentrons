/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference types="vitest" />
/// <reference types="vite/client" />

// todo(mm, 2025-09-15): This file is used under confusing circumstances.
//
// For normal production bundling and dev-serving, each project has its own
// vite.config.mts.
//
// For vitest invocations, vitest would normally default to those same project-specific
// vite.config.mts files. However, because we have this single global
// vitest.config.mts, it uses this instead, completely ignoring the project-specific
// files.
//
// So, that leaves us with:
// - An arbitrary split between this global vite.config.mts the global vitest.config.mts
// - Global vite.config.mts and global vitest.config.mts comprising, together, an
//   amalgamation of all projects' needs -- all projects' aliases, all projects' defines, etc.
// - Which is probably largely duplicating the existing project-local configs,
//   which we'd get for free if we didn't override them with our vitest.config.mts

import path from 'path'
import react from '@vitejs/plugin-react'
import lostCss from 'lost'
import postCssApply from 'postcss-apply'
import postColorModFunction from 'postcss-color-mod-function'
import postCssImport from 'postcss-import'
import postCssPresetEnv from 'postcss-preset-env'
import { configDefaults, defineConfig } from 'vitest/config'

// eslint-disable-next-line import/no-default-export
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
        postCssApply(),
        postColorModFunction(),
        postCssPresetEnv({ stage: 0 }),
        lostCss(),
      ],
    },
  },
  test: {
    environment: 'jsdom',
    allowOnly: true,
    exclude: [
      ...configDefaults.exclude,
      '**/node_modules/**',
      '**/dist/**',
      '**/js-package-testing/**',
      '**/lib/**',
      '**/js-package-testing/tests/**',
    ],
    setupFiles: ['./setup-vitest.mts'],
    coverage: {
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/__tests__/**',
        '**/lib/**',
        '**/js-package-testing/tests/**',
        ...configDefaults.exclude,
      ],
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
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
    _OT_LL_MIXPANEL_DEV_ID_: JSON.stringify(process.env.OT_LL_MIXPANEL_DEV_ID),
    _OT_LL_MIXPANEL_ID_: JSON.stringify(process.env.OT_LL_MIXPANEL_ID),
    _OT_PD_BUILD_DATE_: JSON.stringify(process.env.OT_PD_BUILD_DATE),
    _OT_PD_MIXPANEL_DEV_ID_: JSON.stringify(process.env.OT_PD_MIXPANEL_DEV_ID),
    _OT_PD_MIXPANEL_ID_: JSON.stringify(process.env.OT_PD_MIXPANEL_ID),
    _OT_PD_SENTRY_DEV_DSN_: JSON.stringify(process.env.OT_PD_SENTRY_DEV_DSN),
    _OT_PD_SENTRY_DSN_: JSON.stringify(process.env.OT_PD_SENTRY_DSN),
    _OT_PD_VERSION_: JSON.stringify(process.env.OT_PD_VERSION),
    _GIT_COMMIT_HASH_: JSON.stringify(''),
    _GIT_BRANCH_NAME_: JSON.stringify(''),
    _ODD_IP_: JSON.stringify(process.env.ODD_IP ?? 'localhost'),
    global: 'globalThis',
  },
  resolve: {
    alias: [
      // todo(mm, 2025-10-27): These cross-project aliases cause trouble like
      // files being processed with the wrong config (the config from the
      // consuming project vs. the config from the source project).
      // Can these be replaced with regular package.json dependencies?
      {
        find: '@opentrons/components/styles',
        replacement: path.resolve('./components/src/index.module.css'),
      },
      {
        find: '@opentrons/components',
        replacement: path.resolve('./components/src/index.ts'),
      },
      {
        find: '@opentrons/shared-data/pipette/fixtures/name',
        replacement: path.resolve(
          './shared-data/pipette/fixtures/name/index.ts'
        ),
      },
      {
        find: '@opentrons/shared-data/labware/fixtures/1',
        replacement: path.resolve('./shared-data/labware/fixtures/1/index.ts'),
      },
      {
        find: '@opentrons/shared-data/labware/fixtures/2',
        replacement: path.resolve('./shared-data/labware/fixtures/2/index.ts'),
      },
      {
        find: '@opentrons/shared-data/labware/fixtures/3',
        replacement: path.resolve('./shared-data/labware/fixtures/3/index.ts'),
      },
      {
        find: '@opentrons/shared-data',
        replacement: path.resolve('./shared-data/js/index.ts'),
      },
      {
        find: '@opentrons/step-generation',
        replacement: path.resolve('./step-generation/src/index.ts'),
      },
      {
        find: '@opentrons/api-client',
        replacement: path.resolve('./api-client/src/index.ts'),
      },
      {
        find: '@opentrons/react-api-client',
        replacement: path.resolve('./react-api-client/src/index.ts'),
      },
      {
        find: '@opentrons/discovery-client',
        replacement: path.resolve('./discovery-client/src/index.ts'),
      },
      {
        find: '@opentrons/usb-bridge/node-client',
        replacement: path.resolve('./usb-bridge/node-client/src/index.ts'),
      },
      {
        find: '@opentrons/labware-library',
        replacement: path.resolve(
          './labware-library/src/labware-creator/index.tsx'
        ),
      },
      {
        find: '@opentrons/protocol-visualization',
        replacement: path.resolve('./protocol-visualization/src/index.ts'),
      },
      {
        find: /^\/app\/(?!src\/)/,
        replacement: path.resolve('./app/src/') + '/',
      },
      {
        find: /^\/protocol-designer\/(?!src\/)/,
        replacement: path.resolve('./protocol-designer/src/') + '/',
      },
      {
        find: /^\/ai-client\/(?!src\/)/,
        replacement: path.resolve('./opentrons-ai-client/src/') + '/',
      },
    ],
  },
})
