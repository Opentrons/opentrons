/* eslint-disable import/no-default-export */
import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import { cssModuleSideEffect } from './cssModulesSideEffect'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), cssModuleSideEffect()],
  root: '.',
  define: {
    'process.env': {},
  },
  server: {
    hmr: {
      overlay: false,
    },
  },
  resolve: {
    alias: {
      '@opentrons/components/styles/global': path.resolve(
        __dirname,
        'node_modules/@opentrons/components/src/styles/global.css'
      ),
      '@opentrons/components/styles': path.resolve(
        __dirname,
        'node_modules/@opentrons/components/lib/style.css'
      ),
      '@opentrons/protocol-visualization/styles': path.resolve(
        __dirname,
        'node_modules/@opentrons/protocol-visualization/lib/style.css'
      ),
      // Force a single instance of React
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: [
      '@opentrons/components',
      '@opentrons/shared-data',
      '@opentrons/step-generation',
      '@opentrons/protocol-visualization',
      'i18next',
      'react',
      'react-dom',
      'react-i18next',
      'react-query',
      'react-redux',
      'react-window',
      'redux',
    ],
    exclude: ['@opentrons/labware-library'],
    entries: ['./src/main.tsx'],
    force: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
})
