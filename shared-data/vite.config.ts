/* eslint-disable */
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    // Relative to the root
    ssr: 'js/index.ts',
    outDir: 'lib',
    // do not delete the outdir, typescript types might live there and we dont want to delete them
    emptyOutDir: false,
    commonjsOptions: {
      transformMixedEsModules: true,
      esmExternals: true,
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020',
    },
  },
  define: {
    'process.env': process.env,
    global: 'globalThis',
  },
})
