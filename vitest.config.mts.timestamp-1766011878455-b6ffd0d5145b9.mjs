// vitest.config.mts
import path from "path";
import react from "file:///Users/jeatharyradar/opentrons/node_modules/@vitejs/plugin-react/dist/index.mjs";
import lostCss from "file:///Users/jeatharyradar/opentrons/node_modules/lost/lost.js";
import postCssApply from "file:///Users/jeatharyradar/opentrons/node_modules/postcss-apply/dist/index.js";
import postColorModFunction from "file:///Users/jeatharyradar/opentrons/node_modules/postcss-color-mod-function/index.cjs.js";
import postCssImport from "file:///Users/jeatharyradar/opentrons/node_modules/postcss-import/index.js";
import postCssPresetEnv from "file:///Users/jeatharyradar/opentrons/node_modules/postcss-preset-env/dist/index.mjs";
import { configDefaults, defineConfig } from "file:///Users/jeatharyradar/opentrons/node_modules/vitest/dist/config.js";
var vitest_config_default = defineConfig({
  build: {
    // Relative to the root
    outDir: "dist"
  },
  plugins: [
    react({
      include: "**/*.tsx",
      babel: {
        // Use babel.config.js files
        configFile: true
      }
    })
  ],
  optimizeDeps: {
    esbuildOptions: {
      target: "es2020"
    },
    exclude: ["node_modules"]
  },
  css: {
    postcss: {
      plugins: [
        postCssImport({ root: "src/" }),
        postCssApply(),
        postColorModFunction(),
        postCssPresetEnv({ stage: 0 }),
        lostCss()
      ]
    }
  },
  test: {
    environment: "jsdom",
    allowOnly: true,
    exclude: [
      ...configDefaults.exclude,
      "**/node_modules/**",
      "**/dist/**",
      "**/lib/**"
    ],
    setupFiles: ["./setup-vitest.mts"],
    coverage: {
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/__tests__/**",
        "**/lib/**",
        "labware-library/cypress/**/*",
        ...configDefaults.exclude
      ],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"]
    }
  },
  define: {
    // These defines mimic the ones set in various project-local vite.config.mts files.
    // NOTE: For security, only include environment variables here if they're explicitly allowlisted.
    _FF_ENV_VARS_: {},
    _NODE_ENV_: JSON.stringify(process.env.NODE_ENV),
    _OT_AI_CLIENT_MIXPANEL_ID_: JSON.stringify(
      process.env.OT_AI_CLIENT_MIXPANEL_ID
    ),
    _OT_APP_MIXPANEL_ID_: JSON.stringify(process.env.OT_APP_MIXPANEL_ID),
    _OT_LL_MIXPANEL_DEV_ID_: JSON.stringify(process.env.OT_LL_MIXPANEL_DEV_ID),
    _OT_LL_MIXPANEL_ID_: JSON.stringify(process.env.OT_LL_MIXPANEL_ID),
    _OT_PD_BUILD_DATE_: JSON.stringify(process.env.OT_PD_BUILD_DATE),
    _OT_PD_MIXPANEL_DEV_ID_: JSON.stringify(process.env.OT_PD_MIXPANEL_DEV_ID),
    _OT_PD_MIXPANEL_ID_: JSON.stringify(process.env.OT_PD_MIXPANEL_ID),
    _OT_PD_SENTRY_DEV_DSN_: JSON.stringify(process.env.OT_PD_SENTRY_DEV_DSN),
    _OT_PD_SENTRY_DSN_: JSON.stringify(process.env.OT_PD_SENTRY_DSN),
    _OT_PD_VERSION_: JSON.stringify(process.env.OT_PD_VERSION),
    global: "globalThis"
  },
  resolve: {
    alias: {
      // todo(mm, 2025-10-27): These cross-project aliases cause trouble like
      // files being processed with the wrong config (the config from the
      // consuming project vs. the config from the source project).
      // Can these be replaced with regular package.json dependencies?
      "@opentrons/components/styles": path.resolve(
        "./components/src/index.module.css"
      ),
      "@opentrons/components": path.resolve("./components/src/index.ts"),
      "@opentrons/shared-data/pipette/fixtures/name": path.resolve(
        "./shared-data/pipette/fixtures/name/index.ts"
      ),
      "@opentrons/shared-data/labware/fixtures/1": path.resolve(
        "./shared-data/labware/fixtures/1/index.ts"
      ),
      "@opentrons/shared-data/labware/fixtures/2": path.resolve(
        "./shared-data/labware/fixtures/2/index.ts"
      ),
      "@opentrons/shared-data/labware/fixtures/3": path.resolve(
        "./shared-data/labware/fixtures/3/index.ts"
      ),
      "@opentrons/shared-data": path.resolve("./shared-data/js/index.ts"),
      "@opentrons/step-generation": path.resolve(
        "./step-generation/src/index.ts"
      ),
      "@opentrons/api-client": path.resolve("./api-client/src/index.ts"),
      "@opentrons/react-api-client": path.resolve(
        "./react-api-client/src/index.ts"
      ),
      "@opentrons/discovery-client": path.resolve(
        "./discovery-client/src/index.ts"
      ),
      "@opentrons/usb-bridge/node-client": path.resolve(
        "./usb-bridge/node-client/src/index.ts"
      ),
      "@opentrons/labware-library": path.resolve(
        "./labware-library/src/labware-creator/index.tsx"
      ),
      // "The resulting path (...) trailing slashes are removed unless the path is resolved to the root directory."
      // https://nodejs.org/api/path.html#pathresolvepaths
      "/app/": path.resolve("./app/src/") + "/",
      "/protocol-designer/": path.resolve("./protocol-designer/src/") + "/",
      "/ai-client/": path.resolve("./opentrons-ai-client/src/") + "/"
    }
  }
});
export {
  vitest_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy5tdHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvamVhdGhhcnlyYWRhci9vcGVudHJvbnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9qZWF0aGFyeXJhZGFyL29wZW50cm9ucy92aXRlc3QuY29uZmlnLm10c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvamVhdGhhcnlyYWRhci9vcGVudHJvbnMvdml0ZXN0LmNvbmZpZy5tdHNcIjsvKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvdHJpcGxlLXNsYXNoLXJlZmVyZW5jZSAqL1xuLy8vIDxyZWZlcmVuY2UgdHlwZXM9XCJ2aXRlc3RcIiAvPlxuLy8vIDxyZWZlcmVuY2UgdHlwZXM9XCJ2aXRlL2NsaWVudFwiIC8+XG5cbi8vIHRvZG8obW0sIDIwMjUtMDktMTUpOiBUaGlzIGZpbGUgaXMgdXNlZCB1bmRlciBjb25mdXNpbmcgY2lyY3Vtc3RhbmNlcy5cbi8vXG4vLyBGb3Igbm9ybWFsIHByb2R1Y3Rpb24gYnVuZGxpbmcgYW5kIGRldi1zZXJ2aW5nLCBlYWNoIHByb2plY3QgaGFzIGl0cyBvd25cbi8vIHZpdGUuY29uZmlnLm10cy5cbi8vXG4vLyBGb3Igdml0ZXN0IGludm9jYXRpb25zLCB2aXRlc3Qgd291bGQgbm9ybWFsbHkgZGVmYXVsdCB0byB0aG9zZSBzYW1lIHByb2plY3Qtc3BlY2lmaWNcbi8vIHZpdGUuY29uZmlnLm10cyBmaWxlcy4gSG93ZXZlciwgYmVjYXVzZSB3ZSBoYXZlIHRoaXMgc2luZ2xlIGdsb2JhbFxuLy8gdml0ZXN0LmNvbmZpZy5tdHMsIGl0IHVzZXMgdGhpcyBpbnN0ZWFkLCBjb21wbGV0ZWx5IGlnbm9yaW5nIHRoZSBwcm9qZWN0LXNwZWNpZmljXG4vLyBmaWxlcy5cbi8vXG4vLyBTbywgdGhhdCBsZWF2ZXMgdXMgd2l0aDpcbi8vIC0gQW4gYXJiaXRyYXJ5IHNwbGl0IGJldHdlZW4gdGhpcyBnbG9iYWwgdml0ZS5jb25maWcubXRzIHRoZSBnbG9iYWwgdml0ZXN0LmNvbmZpZy5tdHNcbi8vIC0gR2xvYmFsIHZpdGUuY29uZmlnLm10cyBhbmQgZ2xvYmFsIHZpdGVzdC5jb25maWcubXRzIGNvbXByaXNpbmcsIHRvZ2V0aGVyLCBhblxuLy8gICBhbWFsZ2FtYXRpb24gb2YgYWxsIHByb2plY3RzJyBuZWVkcyAtLSBhbGwgcHJvamVjdHMnIGFsaWFzZXMsIGFsbCBwcm9qZWN0cycgZGVmaW5lcywgZXRjLlxuLy8gLSBXaGljaCBpcyBwcm9iYWJseSBsYXJnZWx5IGR1cGxpY2F0aW5nIHRoZSBleGlzdGluZyBwcm9qZWN0LWxvY2FsIGNvbmZpZ3MsXG4vLyAgIHdoaWNoIHdlJ2QgZ2V0IGZvciBmcmVlIGlmIHdlIGRpZG4ndCBvdmVycmlkZSB0aGVtIHdpdGggb3VyIHZpdGVzdC5jb25maWcubXRzXG5cbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnXG5pbXBvcnQgbG9zdENzcyBmcm9tICdsb3N0J1xuaW1wb3J0IHBvc3RDc3NBcHBseSBmcm9tICdwb3N0Y3NzLWFwcGx5J1xuaW1wb3J0IHBvc3RDb2xvck1vZEZ1bmN0aW9uIGZyb20gJ3Bvc3Rjc3MtY29sb3ItbW9kLWZ1bmN0aW9uJ1xuaW1wb3J0IHBvc3RDc3NJbXBvcnQgZnJvbSAncG9zdGNzcy1pbXBvcnQnXG5pbXBvcnQgcG9zdENzc1ByZXNldEVudiBmcm9tICdwb3N0Y3NzLXByZXNldC1lbnYnXG5pbXBvcnQgeyBjb25maWdEZWZhdWx0cywgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZXN0L2NvbmZpZydcblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGltcG9ydC9uby1kZWZhdWx0LWV4cG9ydFxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgYnVpbGQ6IHtcbiAgICAvLyBSZWxhdGl2ZSB0byB0aGUgcm9vdFxuICAgIG91dERpcjogJ2Rpc3QnLFxuICB9LFxuICBwbHVnaW5zOiBbXG4gICAgcmVhY3Qoe1xuICAgICAgaW5jbHVkZTogJyoqLyoudHN4JyxcbiAgICAgIGJhYmVsOiB7XG4gICAgICAgIC8vIFVzZSBiYWJlbC5jb25maWcuanMgZmlsZXNcbiAgICAgICAgY29uZmlnRmlsZTogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSksXG4gIF0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGVzYnVpbGRPcHRpb25zOiB7XG4gICAgICB0YXJnZXQ6ICdlczIwMjAnLFxuICAgIH0sXG4gICAgZXhjbHVkZTogWydub2RlX21vZHVsZXMnXSxcbiAgfSxcbiAgY3NzOiB7XG4gICAgcG9zdGNzczoge1xuICAgICAgcGx1Z2luczogW1xuICAgICAgICBwb3N0Q3NzSW1wb3J0KHsgcm9vdDogJ3NyYy8nIH0pLFxuICAgICAgICBwb3N0Q3NzQXBwbHkoKSxcbiAgICAgICAgcG9zdENvbG9yTW9kRnVuY3Rpb24oKSxcbiAgICAgICAgcG9zdENzc1ByZXNldEVudih7IHN0YWdlOiAwIH0pLFxuICAgICAgICBsb3N0Q3NzKCksXG4gICAgICBdLFxuICAgIH0sXG4gIH0sXG4gIHRlc3Q6IHtcbiAgICBlbnZpcm9ubWVudDogJ2pzZG9tJyxcbiAgICBhbGxvd09ubHk6IHRydWUsXG4gICAgZXhjbHVkZTogW1xuICAgICAgLi4uY29uZmlnRGVmYXVsdHMuZXhjbHVkZSxcbiAgICAgICcqKi9ub2RlX21vZHVsZXMvKionLFxuICAgICAgJyoqL2Rpc3QvKionLFxuICAgICAgJyoqL2xpYi8qKicsXG4gICAgXSxcbiAgICBzZXR1cEZpbGVzOiBbJy4vc2V0dXAtdml0ZXN0Lm10cyddLFxuICAgIGNvdmVyYWdlOiB7XG4gICAgICBleGNsdWRlOiBbXG4gICAgICAgICcqKi9ub2RlX21vZHVsZXMvKionLFxuICAgICAgICAnKiovZGlzdC8qKicsXG4gICAgICAgICcqKi9fX3Rlc3RzX18vKionLFxuICAgICAgICAnKiovbGliLyoqJyxcbiAgICAgICAgJ2xhYndhcmUtbGlicmFyeS9jeXByZXNzLyoqLyonLFxuICAgICAgICAuLi5jb25maWdEZWZhdWx0cy5leGNsdWRlLFxuICAgICAgXSxcbiAgICAgIHByb3ZpZGVyOiAndjgnLFxuICAgICAgcmVwb3J0ZXI6IFsndGV4dCcsICdqc29uJywgJ2h0bWwnLCAnbGNvdiddLFxuICAgIH0sXG4gIH0sXG4gIGRlZmluZToge1xuICAgIC8vIFRoZXNlIGRlZmluZXMgbWltaWMgdGhlIG9uZXMgc2V0IGluIHZhcmlvdXMgcHJvamVjdC1sb2NhbCB2aXRlLmNvbmZpZy5tdHMgZmlsZXMuXG4gICAgLy8gTk9URTogRm9yIHNlY3VyaXR5LCBvbmx5IGluY2x1ZGUgZW52aXJvbm1lbnQgdmFyaWFibGVzIGhlcmUgaWYgdGhleSdyZSBleHBsaWNpdGx5IGFsbG93bGlzdGVkLlxuICAgIF9GRl9FTlZfVkFSU186IHt9LFxuICAgIF9OT0RFX0VOVl86IEpTT04uc3RyaW5naWZ5KHByb2Nlc3MuZW52Lk5PREVfRU5WKSxcbiAgICBfT1RfQUlfQ0xJRU5UX01JWFBBTkVMX0lEXzogSlNPTi5zdHJpbmdpZnkoXG4gICAgICBwcm9jZXNzLmVudi5PVF9BSV9DTElFTlRfTUlYUEFORUxfSURcbiAgICApLFxuICAgIF9PVF9BUFBfTUlYUEFORUxfSURfOiBKU09OLnN0cmluZ2lmeShwcm9jZXNzLmVudi5PVF9BUFBfTUlYUEFORUxfSUQpLFxuICAgIF9PVF9MTF9NSVhQQU5FTF9ERVZfSURfOiBKU09OLnN0cmluZ2lmeShwcm9jZXNzLmVudi5PVF9MTF9NSVhQQU5FTF9ERVZfSUQpLFxuICAgIF9PVF9MTF9NSVhQQU5FTF9JRF86IEpTT04uc3RyaW5naWZ5KHByb2Nlc3MuZW52Lk9UX0xMX01JWFBBTkVMX0lEKSxcbiAgICBfT1RfUERfQlVJTERfREFURV86IEpTT04uc3RyaW5naWZ5KHByb2Nlc3MuZW52Lk9UX1BEX0JVSUxEX0RBVEUpLFxuICAgIF9PVF9QRF9NSVhQQU5FTF9ERVZfSURfOiBKU09OLnN0cmluZ2lmeShwcm9jZXNzLmVudi5PVF9QRF9NSVhQQU5FTF9ERVZfSUQpLFxuICAgIF9PVF9QRF9NSVhQQU5FTF9JRF86IEpTT04uc3RyaW5naWZ5KHByb2Nlc3MuZW52Lk9UX1BEX01JWFBBTkVMX0lEKSxcbiAgICBfT1RfUERfU0VOVFJZX0RFVl9EU05fOiBKU09OLnN0cmluZ2lmeShwcm9jZXNzLmVudi5PVF9QRF9TRU5UUllfREVWX0RTTiksXG4gICAgX09UX1BEX1NFTlRSWV9EU05fOiBKU09OLnN0cmluZ2lmeShwcm9jZXNzLmVudi5PVF9QRF9TRU5UUllfRFNOKSxcbiAgICBfT1RfUERfVkVSU0lPTl86IEpTT04uc3RyaW5naWZ5KHByb2Nlc3MuZW52Lk9UX1BEX1ZFUlNJT04pLFxuICAgIGdsb2JhbDogJ2dsb2JhbFRoaXMnLFxuICB9LFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIC8vIHRvZG8obW0sIDIwMjUtMTAtMjcpOiBUaGVzZSBjcm9zcy1wcm9qZWN0IGFsaWFzZXMgY2F1c2UgdHJvdWJsZSBsaWtlXG4gICAgICAvLyBmaWxlcyBiZWluZyBwcm9jZXNzZWQgd2l0aCB0aGUgd3JvbmcgY29uZmlnICh0aGUgY29uZmlnIGZyb20gdGhlXG4gICAgICAvLyBjb25zdW1pbmcgcHJvamVjdCB2cy4gdGhlIGNvbmZpZyBmcm9tIHRoZSBzb3VyY2UgcHJvamVjdCkuXG4gICAgICAvLyBDYW4gdGhlc2UgYmUgcmVwbGFjZWQgd2l0aCByZWd1bGFyIHBhY2thZ2UuanNvbiBkZXBlbmRlbmNpZXM/XG4gICAgICAnQG9wZW50cm9ucy9jb21wb25lbnRzL3N0eWxlcyc6IHBhdGgucmVzb2x2ZShcbiAgICAgICAgJy4vY29tcG9uZW50cy9zcmMvaW5kZXgubW9kdWxlLmNzcydcbiAgICAgICksXG4gICAgICAnQG9wZW50cm9ucy9jb21wb25lbnRzJzogcGF0aC5yZXNvbHZlKCcuL2NvbXBvbmVudHMvc3JjL2luZGV4LnRzJyksXG4gICAgICAnQG9wZW50cm9ucy9zaGFyZWQtZGF0YS9waXBldHRlL2ZpeHR1cmVzL25hbWUnOiBwYXRoLnJlc29sdmUoXG4gICAgICAgICcuL3NoYXJlZC1kYXRhL3BpcGV0dGUvZml4dHVyZXMvbmFtZS9pbmRleC50cydcbiAgICAgICksXG4gICAgICAnQG9wZW50cm9ucy9zaGFyZWQtZGF0YS9sYWJ3YXJlL2ZpeHR1cmVzLzEnOiBwYXRoLnJlc29sdmUoXG4gICAgICAgICcuL3NoYXJlZC1kYXRhL2xhYndhcmUvZml4dHVyZXMvMS9pbmRleC50cydcbiAgICAgICksXG4gICAgICAnQG9wZW50cm9ucy9zaGFyZWQtZGF0YS9sYWJ3YXJlL2ZpeHR1cmVzLzInOiBwYXRoLnJlc29sdmUoXG4gICAgICAgICcuL3NoYXJlZC1kYXRhL2xhYndhcmUvZml4dHVyZXMvMi9pbmRleC50cydcbiAgICAgICksXG4gICAgICAnQG9wZW50cm9ucy9zaGFyZWQtZGF0YS9sYWJ3YXJlL2ZpeHR1cmVzLzMnOiBwYXRoLnJlc29sdmUoXG4gICAgICAgICcuL3NoYXJlZC1kYXRhL2xhYndhcmUvZml4dHVyZXMvMy9pbmRleC50cydcbiAgICAgICksXG4gICAgICAnQG9wZW50cm9ucy9zaGFyZWQtZGF0YSc6IHBhdGgucmVzb2x2ZSgnLi9zaGFyZWQtZGF0YS9qcy9pbmRleC50cycpLFxuICAgICAgJ0BvcGVudHJvbnMvc3RlcC1nZW5lcmF0aW9uJzogcGF0aC5yZXNvbHZlKFxuICAgICAgICAnLi9zdGVwLWdlbmVyYXRpb24vc3JjL2luZGV4LnRzJ1xuICAgICAgKSxcbiAgICAgICdAb3BlbnRyb25zL2FwaS1jbGllbnQnOiBwYXRoLnJlc29sdmUoJy4vYXBpLWNsaWVudC9zcmMvaW5kZXgudHMnKSxcbiAgICAgICdAb3BlbnRyb25zL3JlYWN0LWFwaS1jbGllbnQnOiBwYXRoLnJlc29sdmUoXG4gICAgICAgICcuL3JlYWN0LWFwaS1jbGllbnQvc3JjL2luZGV4LnRzJ1xuICAgICAgKSxcbiAgICAgICdAb3BlbnRyb25zL2Rpc2NvdmVyeS1jbGllbnQnOiBwYXRoLnJlc29sdmUoXG4gICAgICAgICcuL2Rpc2NvdmVyeS1jbGllbnQvc3JjL2luZGV4LnRzJ1xuICAgICAgKSxcbiAgICAgICdAb3BlbnRyb25zL3VzYi1icmlkZ2Uvbm9kZS1jbGllbnQnOiBwYXRoLnJlc29sdmUoXG4gICAgICAgICcuL3VzYi1icmlkZ2Uvbm9kZS1jbGllbnQvc3JjL2luZGV4LnRzJ1xuICAgICAgKSxcbiAgICAgICdAb3BlbnRyb25zL2xhYndhcmUtbGlicmFyeSc6IHBhdGgucmVzb2x2ZShcbiAgICAgICAgJy4vbGFid2FyZS1saWJyYXJ5L3NyYy9sYWJ3YXJlLWNyZWF0b3IvaW5kZXgudHN4J1xuICAgICAgKSxcbiAgICAgIC8vIFwiVGhlIHJlc3VsdGluZyBwYXRoICguLi4pIHRyYWlsaW5nIHNsYXNoZXMgYXJlIHJlbW92ZWQgdW5sZXNzIHRoZSBwYXRoIGlzIHJlc29sdmVkIHRvIHRoZSByb290IGRpcmVjdG9yeS5cIlxuICAgICAgLy8gaHR0cHM6Ly9ub2RlanMub3JnL2FwaS9wYXRoLmh0bWwjcGF0aHJlc29sdmVwYXRoc1xuICAgICAgJy9hcHAvJzogcGF0aC5yZXNvbHZlKCcuL2FwcC9zcmMvJykgKyAnLycsXG4gICAgICAnL3Byb3RvY29sLWRlc2lnbmVyLyc6IHBhdGgucmVzb2x2ZSgnLi9wcm90b2NvbC1kZXNpZ25lci9zcmMvJykgKyAnLycsXG4gICAgICAnL2FpLWNsaWVudC8nOiBwYXRoLnJlc29sdmUoJy4vb3BlbnRyb25zLWFpLWNsaWVudC9zcmMvJykgKyAnLycsXG4gICAgfSxcbiAgfSxcbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBcUJBLE9BQU8sVUFBVTtBQUNqQixPQUFPLFdBQVc7QUFDbEIsT0FBTyxhQUFhO0FBQ3BCLE9BQU8sa0JBQWtCO0FBQ3pCLE9BQU8sMEJBQTBCO0FBQ2pDLE9BQU8sbUJBQW1CO0FB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
