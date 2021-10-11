// vite dev server configuration
// documentation: https://vitejs.dev/config/
import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'

import { ALIAS_ENTRIES } from '../rollup.config'

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  root: __dirname,
  plugins: [reactRefresh()],

  // use @opentrons dependencies in this repositry for development purposes
  // this configuration should not be used in a production app
  resolve: { alias: ALIAS_ENTRIES },
})
