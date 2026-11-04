/* eslint-disable */
import { defineConfig } from 'vite'

function isExternal(id: string): boolean {
  // Keep shared-data external (separate package). Bundle lodash/immer/uuid so Node ESM
  // can load the entry without legacy extensionless subpath imports.
  return (
    id === '@opentrons/shared-data' || id.startsWith('@opentrons/shared-data/')
  )
}

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      fileName: format => (format === 'es' ? 'index.mjs' : 'index.cjs'),
    },
    outDir: 'lib',
    emptyOutDir: false,
    commonjsOptions: {
      transformMixedEsModules: true,
      esmExternals: true,
    },
    rollupOptions: {
      external: isExternal,
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
    // NOTE: For security, only include environment variables here if they are explicitly allowlisted.
    global: 'globalThis',
  },
})
