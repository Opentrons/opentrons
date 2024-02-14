/// <reference types="vitest" />
/// <reference types="vite/client" />
import path from 'path'
import { configDefaults, defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(viteConfig, defineConfig({
  test: {
    environment: 'jsdom',
    exclude: [
      ...configDefaults.exclude,
      '**/node_modules/**',
      '**/dist/**'
    ],
    setupFiles: ['./setup-vitest.js'] 
  },
  resolve: {
    alias: {
      '@opentrons/components/styles': path.resolve('./components/src/index.module.css'),
      '@opentrons/components': path.resolve('./components/src/index.ts'),
      '@opentrons/shared-data/pipette/fixtures/name': path.resolve('./shared-data/pipette/fixtures/name/index.ts'),
      '@opentrons/shared-data/labware/fixtures/1': path.resolve('./shared-data/labware/fixtures/1/index.ts'),
      '@opentrons/shared-data/labware/fixtures/2': path.resolve('./shared-data/labware/fixtures/2/index.ts'),
      '@opentrons/shared-data': path.resolve('./shared-data/js/index.ts'),
      '@opentrons/step-generation': path.resolve('./step-generation/src/index.ts'),
      '@opentrons/api-client': path.resolve('./api-client/src/index.ts'),
      '@opentrons/react-api-client': path.resolve( './react-api-client/src/index.ts'),
    },
  },
}))

