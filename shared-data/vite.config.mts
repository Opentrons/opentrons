/* eslint-disable */
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: 'js/index.ts',
        labware: 'js/labware.ts',
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) =>
        format === 'es' ? `${entryName}.mjs` : `${entryName}.cjs`,
    },
    outDir: 'lib',
    // do not delete the outdir, typescript types might live there and we dont want to delete them
    emptyOutDir: false,
    commonjsOptions: {
      transformMixedEsModules: true,
      esmExternals: true,
    },
    rollupOptions: {
      output: {
        exports: 'named',
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020',
    },
  },
  define: {
    // NOTE: For security, only include environment variables here if they're explicitly allowlisted.
    global: 'globalThis',
  },
})
