import path from 'path'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import react from '@vitejs/plugin-react'
import lostCss from 'lost'
import postCssApply from 'postcss-apply'
import postColorModFunction from 'postcss-color-mod-function'
import postCssImport from 'postcss-import'
import postCssPresetEnv from 'postcss-preset-env'
import { defineConfig } from 'vite'

import {
  getGitBuildDetails,
  versionForProject,
} from '../scripts/git-version.mjs'
import { cssModuleSideEffect } from './cssModuleSideEffect'

import type { UserConfig } from 'vite'

export default defineConfig(async (): Promise<UserConfig> => {
  const project = process.env.OPENTRONS_PROJECT ?? 'robot-stack'
  const version = await versionForProject(project)
  const mode = process.env.NODE_ENV ?? 'development'
  const buildTarget = process.env.OT_BUILD_TARGET ?? 'desktop'
  const gitDetails = await getGitBuildDetails()

  return {
    // this makes imports relative rather than absolute
    base: '',
    build: {
      // Relative to the root
      outDir: 'dist',
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
      sentryVitePlugin({
        org: 'opentrons-sw',
        project: buildTarget === 'desktop' ? 'app' : 'odd',
        authToken: process.env.OT_SENTRY_AUTH_TOKEN,
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
      _PKG_VERSION_: JSON.stringify(version),
      _GIT_COMMIT_HASH_: JSON.stringify(gitDetails?.commitHash),
      _GIT_BRANCH_NAME_: JSON.stringify(gitDetails?.branchName),
      _OPENTRONS_PROJECT_: JSON.stringify(project),
      _OT_SENTRY_DSN_: JSON.stringify(process.env.OT_SENTRY_DSN),
      _NODE_ENV_: JSON.stringify(process.env.NODE_ENV),
      _OT_APP_MIXPANEL_ID_: JSON.stringify(process.env.OT_APP_MIXPANEL_ID),
      _ODD_IP_: JSON.stringify(process.env.ODD_IP ?? 'localhost'),
      // _OT_LL_ variables because app/ imports files directly from labware-library/,
      // causing them to be processed in the context of this Vite config instead of
      // labware-library's Vite config.
      _OT_LL_MIXPANEL_DEV_ID_: JSON.stringify(
        process.env.OT_LL_MIXPANEL_DEV_ID
      ),
      _OT_LL_MIXPANEL_ID_: JSON.stringify(process.env.OT_LL_MIXPANEL_ID),
      'process.env.NODE_DEBUG': JSON.stringify(process.env.NODE_DEBUG),
    },
    resolve: {
      alias: {
        // todo(mm, 2025-10-27): These cross-project aliases cause trouble like
        // files being processed with the wrong config (the config from the
        // consuming project vs. the config from the source project).
        // Can these be replaced with regular package.json dependencies?
        '@opentrons/components/styles/global': path.resolve(
          '../components/src/styles/global.css'
        ),
        '@opentrons/components/styles': path.resolve(
          '../components/src/index.module.css'
        ),
        '@opentrons/components': path.resolve('../components/src/index.ts'),
        '@opentrons/shared-data': path.resolve('../shared-data/js/index.ts'),
        '@opentrons/step-generation': path.resolve(
          '../step-generation/src/index.ts'
        ),
        '@opentrons/labware-library': path.resolve(
          '../labware-library/src/labware-creator'
        ),
        '@opentrons/api-client': path.resolve('../api-client/src/index.ts'),
        '@opentrons/react-api-client': path.resolve(
          '../react-api-client/src/index.ts'
        ),
        // "The resulting path (...) trailing slashes are removed unless the path is resolved to the root directory."
        // https://nodejs.org/api/path.html#pathresolvepaths
        '/app/': path.resolve('./src/') + '/',
      },
    },
  }
})
