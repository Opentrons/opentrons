import path, { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [],
  build: {
    // Relative to the root
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'OpentronsReactApiClient',
      formats: ['es', 'umd'],
      fileName: format => `react-api-client.${format}.js`,
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
      },
    },
    sourcemap: false,
    minify: true,
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020',
    },
  },
  resolve: {
    alias: {
      '@opentrons/shared-data': path.resolve('../shared-data/js/index.ts'),
      '@opentrons/api-client': path.resolve('../api-client/src/index.ts'),
    },
  },
})
