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
    // Build a library bundle
    lib: {
      entry: 'src/index.ts',
      name: 'OpentronsComponents',
      fileName: 'index',
      formats: ['es'],
    },
    outDir: 'lib',
    // Do not delete the outdir, typescript types might live there and we don't want to delete them
    emptyOutDir: false,
    commonjsOptions: {
      transformMixedEsModules: true,
      esmExternals: true,
    },
    rollupOptions: {
      // Only @opentrons/shared-data and React/React-DOM are external; step-generation will be bundled!
      external: [
        '@opentrons/shared-data',
        'react',
        'react-dom',
        'react/jsx-runtime',
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@opentrons/shared-data': 'OpentronsSharedData',
        },
        // Ensure CSS is extracted properly
        assetFileNames: (assetInfo) => {
          if (assetInfo.names?.some(name => name.endsWith('.css'))) {
            return 'style.css'
          }
          return assetInfo.names?.[0] || 'asset'
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
    cssModuleSideEffect(),
  ],
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020',
    },
  },
  css: {
    modules: {
      generateScopedName: '[name]__[local]___[hash:base64:5]',
      localsConvention: 'camelCase',
    },
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
  },
  resolve: {
    alias: {
      '@opentrons/shared-data': path.resolve('../shared-data/js/index.ts'),
      '@opentrons/components/styles': path.resolve(
        '../components/src/index.module.css'
      ),
      '@opentrons/step-generation': path.resolve(
        '../step-generation/src/index.ts'
      ),
    },
  },
})
