import fs from 'node:fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import postCssImport from 'postcss-import'
import postCssApply from 'postcss-apply'
import postColorModFunction from 'postcss-color-mod-function'
import postCssPresetEnv from 'postcss-preset-env'
import lostCss from 'lost'
import { cssModuleSideEffect } from './cssModuleSideEffect'
import createGitVersionToolkit from '../scripts/git-version-v2.mjs'

const { generateBuildInfoHtml } = createGitVersionToolkit({
  project: 'labware-library',
})

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LABWARE_IMAGE_DIR = path.resolve(
  __dirname,
  '../shared-data/labware/images'
)
const LABWARE_IMAGE_NAME_PATTERN = /\.(?:png|jpe?g)$/i

const labwareImageFilenames: Set<string> = (() => {
  try {
    return new Set(
      fs
        .readdirSync(LABWARE_IMAGE_DIR, { withFileTypes: true })
        .filter(
          entry => entry.isFile() && LABWARE_IMAGE_NAME_PATTERN.test(entry.name)
        )
        .map(entry => entry.name)
    )
  } catch (error) {
    console.warn(
      '[labware-library] Unable to read shared labware images directory',
      error
    )
    return new Set<string>()
  }
})()

const isLabwareReferenceImage = (assetName?: string): boolean => {
  if (assetName == null) return false
  return labwareImageFilenames.has(assetName)
}

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
      output: {
        assetFileNames: assetInfo => {
          if (isLabwareReferenceImage(assetInfo.name)) {
            // Keep labware reference images stable for hotlinking
            return 'labware-images/[name][extname]'
          }

          return 'assets/[name]-[hash][extname]'
        },
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
    {
      name: 'build-info-generator',
      closeBundle: async () => {
        const outputPath = path.resolve(__dirname, 'dist', 'info', 'index.html')
        await generateBuildInfoHtml(outputPath)
      },
    },
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
