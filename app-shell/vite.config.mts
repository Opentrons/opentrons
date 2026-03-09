import { versionForProject } from '../scripts/git-version.mjs'
import pkg from './package.json'
import path from 'path'
import { defineConfig } from 'vite'
import type { UserConfig } from 'vite'

export default defineConfig(
  async (): Promise<UserConfig> => {
    const project = process.env.OPENTRONS_PROJECT ?? 'robot-stack'
    const version = await versionForProject(project)
    return {
      // this makes imports relative rather than absolute
      base: '',
      publicDir: false,
      build: {
        // Relative to the root
        ssr: 'src/main.ts',
        outDir: 'lib',
        commonjsOptions: {
          transformMixedEsModules: true,
          esmExternals: true,
          exclude: [/node_modules/],
        },
        lib: {
          entry: {
            main: 'src/main.ts',
            preload: 'src/preload.ts',
          },

          formats: ['cjs'],
        },
      },
      optimizeDeps: {
        esbuildOptions: {
          target: 'CommonJs',
        },
        exclude: ['node_modules'],
      },
      define: {
        // NOTE: For security, only include environment variables here if they're explicitly allowlisted.
        global: 'globalThis',
        _NODE_ENV_: JSON.stringify(process.env.NODE_ENV),
        _OPENTRONS_PROJECT_: JSON.stringify(project),
        _PKG_BUGS_URL_: JSON.stringify(pkg.bugs.url),
        _PKG_PRODUCT_NAME_: JSON.stringify(pkg.productName),
        _PKG_VERSION_: JSON.stringify(version),
      },
      resolve: {
        alias: {
          // todo(mm, 2025-10-27): These cross-project aliases cause trouble like
          // files being processed with the wrong config (the config from the
          // consuming project vs. the config from the source project).
          // Can these be replaced with regular package.json dependencies?
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
          '@opentrons/shared-data/labware/fixtures/3': path.resolve(
            '../shared-data/labware/fixtures/3/index.ts'
          ),
        },
      },
    }
  }
)
