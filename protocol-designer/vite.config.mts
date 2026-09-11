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
import { nodePolyfills } from 'vite-plugin-node-polyfills'

import createGitVersionToolkit from '../scripts/git-version-v2.mjs'
import { latestLabwareVersions } from '../scripts/git-version.mjs'
import { cssModuleSideEffect } from './cssModuleSideEffect'

import type { UserConfig } from 'vite'

const REQUIRED_APP_VERSION = '10.2.0-beta' // PD requires this robot stack version or higher
const { getVersion, generateBuildInfoHtml } = createGitVersionToolkit({
  project: 'protocol-designer',
})

const isCI = process.env.CI === 'true'

const sentryReleaseEnv = !!process.env.SENTRY_RELEASE
  ? process.env.SENTRY_RELEASE
  : undefined

const hasSentryCreds =
  !!process.env.SENTRY_AUTH_TOKEN &&
  !!process.env.SENTRY_ORG &&
  !!process.env.SENTRY_PROJECT

// Local opt-in only: devs can enable the plugin by exporting SENTRY_* env vars.
// When enabled locally, the plugin will upload sourcemaps under the `local-dev`
// release name. The runtime SDK is configured to report the same release so local
// events can resolve uploaded sourcemaps.
// In CI, sourcemap upload is disabled by default and must be explicitly opted in.
const enableSentryLocalSourcemapUpload = !isCI && hasSentryCreds
const enableSentryCiSourcemapUpload =
  isCI && hasSentryCreds && process.env.OT_PD_SENTRY_PLUGIN_UPLOAD === 'true'
const enableSentrySourcemapUpload =
  enableSentryLocalSourcemapUpload || enableSentryCiSourcemapUpload

export default defineConfig(async (): Promise<UserConfig> => {
  const OT_PD_VERSION = await getVersion()
  const OT_PD_BUILD_DATE = new Date().toUTCString()
  const OT_PD_LATEST_LABWARE_VERSIONS =
    await latestLabwareVersions(REQUIRED_APP_VERSION)

  return {
    // this makes imports relative rather than absolute
    base: '',
    build: {
      // Relative to the root
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        external: ['react/compiler-runtime'],
        output: {
          // Not hidden: emit normal sourcemaps so devtools + Sentry can auto-detect.
          manualChunks(id) {
            // need to specify to avoid duplicated bundling
            if (id.includes('/shared-data/js')) return 'opentrons-shared-data'
            if (id.includes('/components/src')) return 'opentrons-components'
            if (id.includes('/step-generation/src'))
              return 'opentrons-step-generation'

            if (id.includes('node_modules')) {
              // plotly is only used in ByVolumeBuilder (inside the lazy Designer
              // page) — keep it out of vendor so it doesn't load on every page
              if (
                id.includes('plotly.js-cartesian-dist') ||
                id.includes('react-plotly.js')
              )
                return undefined
              return 'vendor'
            }
          },
        },
      },
    },
    worker: {
      // Vite builds web workers in a separate bundle context with its own plugin pipeline.
      // Add a Sentry plugin instance here so worker chunks get debug IDs injected.
      // The main Sentry plugin instance (below) will then upload all debug-ID-enabled
      // chunks (including workers) in a single upload.
      //
      // IMPORTANT: Prevent this worker plugin from uploading on its own by overriding
      // auth/org/project with empty strings (so it does not fall back to process.env).
      plugins: () => [
        sentryVitePlugin({
          silent: true,
          telemetry: false,
          authToken: '',
          org: '',
          project: '',
          release: { inject: false },
        }),
      ],
    },
    plugins: [
      nodePolyfills({
        include: ['assert', 'buffer', 'process', 'util'],
        globals: { Buffer: true, global: true, process: true },
      }),
      react({
        include: '**/*.tsx',
        babel: { configFile: true },
        jsxRuntime: 'automatic',
      }),
      cssModuleSideEffect(),
      {
        name: 'markdown-loader',
        transform(code, id) {
          if (id.endsWith('.md'))
            return `export default ${JSON.stringify(code)}`
        },
      },

      // Always enable the Sentry Vite plugin so React component names are annotated
      // (better breadcrumbs, component stack traces, etc).
      // Only upload sourcemaps locally when explicitly opted in via SENTRY_* env vars.
      // CI can optionally upload sourcemaps via this plugin when explicitly opted in.
      // (Default CI behavior is still no upload.)
      sentryVitePlugin({
        telemetry: false,
        reactComponentAnnotation: { enabled: true },
        // Local opt-in behavior:
        // - Upload sourcemaps via the plugin (requires SENTRY_* env vars)
        // - Use the `local-dev` release name
        // CI continues to upload via getsentry/action-release.
        release: {
          name: enableSentryLocalSourcemapUpload
            ? 'local-dev'
            : (sentryReleaseEnv ?? OT_PD_VERSION),
          inject: false,
          // set-commits --auto can hang on large monorepos (see sentry-cli set-commits).
          // CI associates commits in getsentry/action-release after the build.
          setCommits: false,
        },
        ...(enableSentrySourcemapUpload
          ? {
              org: process.env.SENTRY_ORG,
              project: process.env.SENTRY_PROJECT,
              authToken: process.env.SENTRY_AUTH_TOKEN,
              sourcemaps: {
                assets: ['./dist/**'],
                ignore: ['./node_modules/**'],
              },
            }
          : {}),
      }),

      {
        name: 'build-info-generator',
        closeBundle: async () => {
          const outputPath = path.resolve(
            __dirname,
            'dist',
            'info',
            'index.html'
          )
          await generateBuildInfoHtml(outputPath)
        },
      },
      ...(process.env.ANALYZE_DEBUG === 'true' ? [analyzer()] : []),
    ],
    optimizeDeps: {
      esbuildOptions: { target: 'es2020' },
    },
    // For unknown reasons, PD whitescreens on launch unless we have this.
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
      _OT_PD_SENTRY_RELEASE_: JSON.stringify(
        enableSentryLocalSourcemapUpload
          ? 'local-dev'
          : (sentryReleaseEnv ?? OT_PD_VERSION)
      ),
      _OT_PD_SENTRY_DEV_DSN_: JSON.stringify(process.env.OT_PD_SENTRY_DEV_DSN),
      _OT_PD_SENTRY_DSN_: JSON.stringify(process.env.OT_PD_SENTRY_DSN),
      _OT_PD_VERSION_: JSON.stringify(OT_PD_VERSION),
      'process.env.NODE_DEBUG': JSON.stringify(process.env.NODE_DEBUG),
      global: 'globalThis',
    },
    resolve: {
      conditions: ['browser'],
      // For unknown reasons, PD whitescreens on launch unless we have this.
      dedupe: ['tslib'],
      alias: {
        tslib: path.resolve('node_modules/tslib'),
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
    server: { port: 5178 },
  }
})

function getFeatureFlagEnvVars(): Record<string, string | undefined> {
  // If we change the prefix to something like "OT_PD_FF_...", we could automatically
  //   // scrape process.env instead of having this explicit list. We don't want to scrape
  // process.env as long as the prefix is just "OT_PD_..." because it might accidentally
  // include something like "OT_PD_SUPER_SECRET_DEPLOY_KEY".
  const envVarNames = new Set([
    'OT_PD_PRERELEASE_MODE',
    'OT_PD_DISABLE_MODULE_RESTRICTIONS',
    'OT_PD_ALLOW_ALL_TIPRACKS',
    'OT_PD_ENABLE_COMMENT',
    'OT_PD_ENABLE_TIP_PICKUP_LOCATION',
    'OT_PD_ENABLE_HOT_KEYS_DISPLAY',
    'OT_PD_ENABLE_MULTIPLE_TEMPS_OT',
    'OT_PD_ENABLE_TIMELINE_SCRUBBER',
    'OT_PD_ENABLE_PARTIAL_TIP_SUPPORT',
    'OT_PD_ENABLE_STACKING',
    'OT_PD_ENABLE_CONCURRENT_MODULE_ACTIONS',
    'OT_PD_ENABLE_BY_VOLUME_BUILDER',
    'OT_PD_ENABLE_TIP_SELCTION',
    'OT_PD_ENABLE_CAMERA_SUPPORT',
  ])
  return Object.fromEntries(
    Object.entries(process.env).filter(([key]) => envVarNames.has(key))
  )
}
