import { versionForProject } from '../scripts/git-version'
import pkg from './package.json'
import path from 'path'
import { UserConfig, defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import postCssImport from 'postcss-import'
import postCssApply from 'postcss-apply'
import postColorModFunction from 'postcss-color-mod-function'
import postCssPresetEnv from 'postcss-preset-env'
import lostCss from 'lost'

export default defineConfig(
  async (): Promise<UserConfig> => {
    const project = process.env.OPENTRONS_PROJECT ?? 'robot-stack'
    const version = await versionForProject(project)
    return {
      publicDir: false,
      build: {
        // Relative to the root
        ssr: 'src/main.ts',
        outDir: 'lib',
        commonjsOptions: {
          transformMixedEsModules: true,
          esmExternals: true,
        },
        lib: {
          entry: {
            main: 'src/main.ts',
            preload: 'src/preload.ts',
          },

          formats: ['cjs'],
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
      ],
      optimizeDeps: {
        esbuildOptions: {
          target: 'CommonJs',
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
        'process.env': process.env,
        global: 'globalThis',
        _PKG_VERSION_: JSON.stringify(version),
        _PKG_PRODUCT_NAME_: JSON.stringify(pkg.productName),
        _PKG_BUGS_URL_: JSON.stringify(pkg.bugs.url),
        _OPENTRONS_PROJECT_: JSON.stringify(project),
      },
      resolve: {
        alias: {
          '@opentrons/components/styles': path.resolve(
            '../components/src/index.module.css'
          ),
          '@opentrons/components': path.resolve('../components/src/index.ts'),
          '@opentrons/shared-data': path.resolve('../shared-data/js/index.ts'),
          '@opentrons/step-generation': path.resolve(
            '../step-generation/src/index.ts'
          ),
          '@opentrons/discovery-client': path.resolve(
            '../discovery-client/src/index.ts'
          ),
          '@opentrons/usb-bridge/node-client': path.resolve(
            '../usb-bridge/node-client/src/index.ts'
          ),
        },
      },
    }
  }
)
