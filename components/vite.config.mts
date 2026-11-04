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
      fileName: format => `index.${format === 'es' ? 'mjs' : 'js'}`,
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
        'react-dom/client',
      ],
      output: {
        // Ensure CSS is bundled and exported with stable names for consumers
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
      // Use a per-module hashed scoped name so unscoped local names
      // (e.g. `.container`, `.header`, `.footer`) cannot collide across
      // modules in the bundled `lib/style.css`. Each `*.module.css` gets its
      // own unique class names, and the compiled JS references the same
      // hashed strings, so consumers of the packed library get isolated
      // styles per component.
      generateScopedName: '[name]__[local]__[hash:base64:5]',
    },
    postcss: {
      plugins: [
        postCssImport({ root: 'src/' }),
        // Remove legacy custom property set blocks so downstream plugins cannot emit invalid CSS
        postCssApply({ preserve: false }),
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
      // todo(mm, 2025-10-27): These cross-project aliases cause trouble like
      // files being processed with the wrong config (the config from the
      // consuming project vs. the config from the source project).
      // Can these be replaced with regular package.json dependencies?
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
