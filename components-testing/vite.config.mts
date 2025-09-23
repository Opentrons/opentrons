import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import { cssModuleSideEffect } from './cssModulesSideEffect'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), cssModuleSideEffect()],
  resolve: {
    alias: {
      '@opentrons/components/styles/global': path.resolve(
        '../components/src/styles/global.css'
      ),
      '@opentrons/components/styles': path.resolve(
        '../components/src/index.module.css'
      ),
      '@opentrons/components': path.resolve('../components/src/index.ts'),
      '@opentrons/shared-data': path.resolve('../shared-data/js/index.ts'),
      '/app/': path.resolve('../app/src/') + '/',
    },
  },
})
