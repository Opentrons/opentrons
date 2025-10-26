import path from 'path'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import react from '@vitejs/plugin-react'
import lostCss from 'lost'
import postCssApply from 'postcss-apply'
import postColorModFunction from 'postcss-color-mod-function'
import postCssImport from 'postcss-import'
import postCssPresetEnv from 'postcss-preset-env'
import { defineConfig } from 'vite'
import { analyzer } from 'vite-bundle-analyzer'

import { latestLabwareVersions } from '../scripts/git-version.mjs'

import {
  getVersion,
  generateBuildInfoHtml,
} from '../scripts/git-version-protocol-designer.mjs'

import { cssModuleSideEffect } from './cssModuleSideEffect'

import type { UserConfig } from 'vite'

const REQUIRED_APP_VERSION = '8.7.0' // PD requires this robot stack version or higher

// eslint-disable-next-line import/no-default-export
export default defineConfig(
  async (): Promise<UserConfig> => {
    const OT_PD_VERSION = await getVersion()
    const OT_PD_BUILD_DATE = new Date().toUTCString()
    const OT_PD_LATEST_LABWARE_VERSIONS = await latestLabwareVersions(
      REQUIRED_APP_VERSION
    )
    const mode = process.env.NODE_ENV ?? 'development'
    return {
      // this makes imports relative rather than absolute
      base: '',
      build: {
        // Relative to the root
        outDir: 'dist',
        // sourcemap for Sentry
        sourcemap: true,
      },
      plugins: [
        react({
          include: '**/*.tsx',
          babel: {
            // Use babel.config.js files
            configFile: true,
          },
        }),
        cssModuleSideEffect(),
        {
          name: 'markdown-loader',
          transform(code, id) {
            if (id.endsWith('.md')) {
              return `export default ${JSON.stringify(code)}`
            }
          },
        },
        sentryVitePlugin({
          org: 'opentrons-76',
          project: 'protocol-designer',
          authToken: process.env.OT_SENTRY_AUTH_TOKEN,
          release: OT_PD_VERSION,
          telemetry: false,
          reactComponentAnnotation: {
            enabled: true,
            ignoredComponents: [], // (kk:08/15/2025) ToDo add later
          },
          sourcemaps: {
            assets: ['./dist/**'],
            ignore: ['./node_modules/**'],
            filesToDeleteAfterUpload:
              mode === 'production' ? ['./dist/**/*.js.map'] : undefined,
          },
        }),
        {
          name: 'build-info-generator',
          closeBundle: async () => {
            const outputPath = path.resolve(__dirname, 'dist', 'info', 'index.html')
            await generateBuildInfoHtml(outputPath)
          },
        },
        ...(process.env.ANALYZE_DEBUG === 'true' ? [analyzer()] : []),
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
        _FF_ENV_VARS_: getFeatureFlagEnvVars(),
        _NODE_ENV_: JSON.stringify(process.env.NODE_ENV),
        _OT_PD_BUILD_DATE_: JSON.stringify(OT_PD_BUILD_DATE),
        _OT_PD_LATEST_LABWARE_VERSIONS_: OT_PD_LATEST_LABWARE_VERSIONS,
        _OT_PD_MIXPANEL_DEV_ID_: JSON.stringify(
          process.env.OT_PD_MIXPANEL_DEV_ID
        ),
        _OT_PD_MIXPANEL_ID_: JSON.stringify(process.env.OT_PD_MIXPANEL_ID),
        _OT_PD_REQUIRED_APP_VERSION_: JSON.stringify(REQUIRED_APP_VERSION),
        _OT_PD_SENTRY_DEV_DSN_: JSON.stringify(
          process.env.OT_PD_SENTRY_DEV_DSN
        ),
        _OT_PD_SENTRY_DSN_: JSON.stringify(process.env.OT_PD_SENTRY_DSN),
        _OT_PD_VERSION_: JSON.stringify(OT_PD_VERSION),
        global: 'globalThis',
      },
      resolve: {
        alias: {
          '@opentrons/components/styles/global': path.resolve(
            '../components/src/styles/global.css'
          ),
          '@opentrons/components': path.resolve('../components/src/index.ts'),
          '@opentrons/shared-data': path.resolve('../shared-data/js/index.ts'),
          '@opentrons/step-generation': path.resolve(
            '../step-generation/src/index.ts'
          ),
          '/protocol-designer/': path.resolve('./src/') + '/',
        },
      },
      server: {
        port: 5178,
        watch: {
          ignored: ['**/cypress/downloads/**'],
        },
      },
    }
  }
)

function getFeatureFlagEnvVars(): Record<string, string | undefined> {
  // If we change the prefix to something like "OT_PD_FF_...", we could automatically
  // scrape process.env instead of having this explicit list. We don't want to scrape
  // process.env as long as the prefix is just "OT_PD_..." because it might accidentally
  // include something like "OT_PD_SUPER_SECRET_DEPLOY_KEY".
  const envVarNames = new Set([
    'OT_PD_PRERELEASE_MODE',
    'OT_PD_DISABLE_MODULE_RESTRICTIONS',
    'OT_PD_ALLOW_ALL_TIPRACKS',
    'OT_PD_ENABLE_COMMENT',
    'OT_PD_ENABLE_TIP_PICKUP_LOCATION',
    'OT_PD_ENABLE_HOT_KEYS_DISPLAY',
    'OT_PD_ENABLE_REACT_SCAN',
    'OT_PD_ENABLE_MULTIPLE_TEMPS_OT',
    'OT_PD_ENABLE_TIMELINE_SCRUBBER',
    'OT_PD_ENABLE_PARTIAL_TIP_SUPPORT',
    'OT_PD_ENABLE_STACKING',
    'OT_PD_ENABLE_CONCURRENT_MODULE_ACTIONS',
    'OT_PD_ENABLE_JSON_EXPORT',
    'OT_PD_ENABLE_BY_VOLUME_BUILDER',
    'OT_PD_ENABLE_TIP_SELCTION',
    'OT_PD_ENABLE_CAMERA_SUPPORT'
  ])
  return Object.fromEntries(
    Object.entries(process.env).filter(([key, _value]) => envVarNames.has(key))
  )
}
