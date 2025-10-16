import path from 'path'
import react from '@vitejs/plugin-react'
import lostCss from 'lost'
import postCssApply from 'postcss-apply'
import postColorModFunction from 'postcss-color-mod-function'
import postCssImport from 'postcss-import'
import postCssPresetEnv from 'postcss-preset-env'
import { defineConfig } from 'vite'

import { cssModuleSideEffect } from './cssModuleSideEffect'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'js'}`,
    },
    outDir: 'lib',
    // Do not delete the outdir, typescript types might live there and we don't want to delete them
    emptyOutDir: false,
    // Ensure CSS is extracted properly
    cssCodeSplit: false,
    commonjsOptions: {
      transformMixedEsModules: true,
      esmExternals: true,
    },
    rollupOptions: {
      // Externalize React runtime so consuming app supplies single instance
      external: [
        '@opentrons/shared-data',
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react-dom/client'
      ],
      output: {
        // Ensure CSS is bundled
        assetFileNames: '[name].[ext]'
      }
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
    cssModuleSideEffect(),
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
        // Apply plugin should come early to transform custom property blocks
        postCssApply(),
        // Process colors and other functions after apply
        postColorModFunction(),
        postCssPresetEnv({ stage: 0 }),
        lostCss(),
      ],
    },
  },
  define: {
    // NOTE: For security, only include environment variables here if they're explicitly allowlisted.
    _NODE_ENV_: JSON.stringify(process.env.NODE_ENV),
    global: 'globalThis',
  },
  resolve: {
    alias: {
      '@opentrons/shared-data': path.resolve('../shared-data/js/index.ts'),
      '@opentrons/components/styles': path.resolve(
        '../components/src/index.module.css'
      ),
      '@opentrons/components/styles/global': path.resolve(
        '../components/src/styles/global.css'
      ),
      '@opentrons/step-generation': path.resolve(
        '../step-generation/src/index.ts'
      ),
    },
  },
})
