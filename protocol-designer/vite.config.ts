import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import postCssImport from 'postcss-import'
import postCssApply from 'postcss-apply'
import postColorModFunction from 'postcss-color-mod-function'
import postCssPresetEnv from 'postcss-preset-env'

export default defineConfig({
  build: {
    // Relative to the root
    outDir: 'dist',
  },
  plugins: [
    // TODO: uncomment out these lines once we figure out how to disable HMR in the web worker context
    // react({
    //   include: '**/*.tsx',
    //   babel: {
    //     // Use babel.config.js files
    //     configFile: true,
    //   },
    // }),
    // reactWorker(),
  ],
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020',
    },
    include: ['@opentrons/shared-data', '@opentrons/step-generation'],
  },
  css: {
    postcss: {
      plugins: [
        postCssImport({ root: 'src/' }),
        postCssApply(),
        postColorModFunction(),
        postCssPresetEnv({ stage: 0 }),
      ],
    },
  },
  define: {
    'process.env': process.env,
    global: 'globalThis',
  },
  resolve: {
    alias: {
      '@opentrons/components/styles': `@opentrons/components/src/index.module.css`,
      '@opentrons/components': `@opentrons/components/src/index.ts`,
      '@opentrons/shared-data': `@opentrons/shared-data/js/index.ts`,
      '@opentrons/step-generation': `@opentrons/step-generation/src/index.ts`,
      '@opentrons/api-client': `${path.resolve(__dirname, 'src')}/index.ts`,
      '@opentrons/react-api-client': `${path.resolve(
        __dirname,
        'src'
      )}/index.ts`,
    },
  },
})
