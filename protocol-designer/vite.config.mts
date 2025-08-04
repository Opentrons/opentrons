import path from 'path'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import react from '@vitejs/plugin-react'
import lostCss from 'lost'
import postCssApply from 'postcss-apply'
import postColorModFunction from 'postcss-color-mod-function'
import postCssImport from 'postcss-import'
import postCssPresetEnv from 'postcss-preset-env'
import { defineConfig } from 'vite'

import { versionForProject } from '../scripts/git-version.mjs'
import { cssModuleSideEffect } from './cssModuleSideEffect'

import type { UserConfig } from 'vite'

// eslint-disable-next-line import/no-default-export
export default defineConfig(
  async (): Promise<UserConfig> => {
    const OT_PD_VERSION = await versionForProject('protocol-designer')
    const OT_PD_BUILD_DATE = new Date().toUTCString()
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
          org: 'opentrons-sw',
          project: 'protocol-designer',
          authToken: process.env.OT_SENTRY_AUTH_TOKEN,
          telemetry: false,
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
        'process.env': { ...process.env, OT_PD_VERSION, OT_PD_BUILD_DATE },
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
