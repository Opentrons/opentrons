import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  build: {
    // Relative to the root
    outDir: 'dist',
    commonjsOptions: { exclude: ['@opentrons/components'] },
    rollupOptions: {
      external: ['@opentrons/components'],
    },
  },
  plugins: [react()],
  css: {
    postcss: {
      plugins: [],
    },
  },
  resolve: {
    alias: {
      // '@opentrons/components': `${path.resolve(__dirname, './src')}/index.ts`,
      '@opentrons/components/styles': `@opentrons/components/src/index.css`,
      '@opentrons/components': `@opentrons/components/src/index.ts`,
      // '@opentrons/shared-data': `${path.resolve(__dirname, './src')}/js/index.ts`,
      '@opentrons/shared-data': `@opentrons/shared-data/js/index.ts`,
      // '@opentrons/step-generation': `${path.resolve(__dirname, 'src')}/index.ts`,
      '@opentrons/step-generation': `@opentrons/step-generation/src/index.ts`,
      '@opentrons/api-client': `${path.resolve(__dirname, 'src')}/index.ts`,
      '@opentrons/react-api-client': `${path.resolve(
        __dirname,
        'src'
      )}/index.ts`,
      // '@opentrons/protocol-designer': `${path.resolve(__dirname, 'src')}/index.ts`,
      // '^@opentrons/discovery-client$': `@opentrons/discovery-client/src/index.ts`,
      // '^@opentrons/components$': `@opentrons/components/src/index.ts`,
      // '^@opentrons/shared-data$': `@opentrons/shared-data/js/index.ts`,
      // '^@opentrons/step-generation$': `@opentrons/step-generation/src/index.ts`,
      // '^@opentrons/api-client$': `@opentrons/api-client/src/index.ts`,
      // '^@opentrons/react-api-client$': `@opentrons/react-api-client/src/index.ts`,
      // '^@opentrons/usb-bridge/node-client$': `@opentrons/usb-bridge/node-client/src/index.ts`,
    },
  },
})
