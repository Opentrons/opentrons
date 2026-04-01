import path from 'path'
import react from '@vitejs/plugin-react'
import lostCss from 'lost'
import postCssApply from 'postcss-apply'
import postColorModFunction from 'postcss-color-mod-function'
import postCssImport from 'postcss-import'
import postCssPresetEnv from 'postcss-preset-env'
import { defineConfig } from 'vite'

import { cssModuleSideEffect } from '../components/cssModuleSideEffect'

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      fileName: format => `index.${format === 'es' ? 'mjs' : 'js'}`,
    },
    outDir: 'lib',
    emptyOutDir: false,
    cssCodeSplit: false,
    commonjsOptions: {
      transformMixedEsModules: true,
      esmExternals: true,
    },
    rollupOptions: {
      external: [
        '@opentrons/components',
        '@opentrons/shared-data',
        '@opentrons/step-generation',
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react-dom/client',
        'clsx',
        'i18next',
        'lodash',
        'react-i18next',
        'react-window',
      ],
      output: {
        assetFileNames: assetInfo => {
          const assetNames = assetInfo.names ?? []
          const representativeName = assetNames[0] ?? ''

          return representativeName.endsWith('.css')
            ? 'style.css'
            : '[name].[ext]'
        },
      },
    },
  },
  plugins: [
    react({
      include: '**/*.tsx',
      babel: {
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
    modules: {
      generateScopedName: 'pv_[name]__[local]',
    },
    postcss: {
      plugins: [
        postCssImport({ root: 'src/' }),
        postCssApply({ preserve: false }),
        postColorModFunction(),
        postCssPresetEnv({ stage: 0 }),
        lostCss(),
      ],
    },
  },
  define: {
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
      '@opentrons/components': path.resolve('../components/src/index.ts'),
      '@opentrons/step-generation': path.resolve(
        '../step-generation/src/index.ts'
      ),
    },
  },
})
