// vitest.config.mts
import path2 from "path";
import { configDefaults, defineConfig as defineConfig2, mergeConfig } from "file:///Users/jeatharyradar/opentrons/node_modules/vitest/dist/config.js";

// vite.config.mts
import path from "path";
import { defineConfig } from "file:///Users/jeatharyradar/opentrons/node_modules/vite/dist/node/index.js";
import react from "file:///Users/jeatharyradar/opentrons/node_modules/@vitejs/plugin-react/dist/index.mjs";
import postCssImport from "file:///Users/jeatharyradar/opentrons/node_modules/postcss-import/index.js";
import postCssApply from "file:///Users/jeatharyradar/opentrons/node_modules/postcss-apply/dist/index.js";
import postColorModFunction from "file:///Users/jeatharyradar/opentrons/node_modules/postcss-color-mod-function/index.cjs.js";
import postCssPresetEnv from "file:///Users/jeatharyradar/opentrons/node_modules/postcss-preset-env/dist/index.mjs";
import lostCss from "file:///Users/jeatharyradar/opentrons/node_modules/lost/lost.js";
var vite_config_default = defineConfig({
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
  define: {
    "process.env": process.env,
    global: "globalThis"
  },
  resolve: {
    alias: {
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
      "/app/": path.resolve("./app/src/") + "/"
    }
  }
});

// vitest.config.mts
var vitest_config_default = mergeConfig(
  vite_config_default,
  defineConfig2({
    test: {
      environment: "jsdom",
      allowOnly: true,
      exclude: [...configDefaults.exclude, "**/node_modules/**", "**/dist/**"],
      setupFiles: ["./setup-vitest.mts"],
      coverage: {
        exclude: ["**/node_modules/**", "**/dist/**", "**/__tests__/**", "protocol-designer/cypress/**/*", "labware-library/cypress/**/*", ...configDefaults.exclude],
        provider: "v8",
        reporter: ["text", "json", "html", "lcov"]
      }
    },
    resolve: {
      alias: {
        "@opentrons/components/styles": path2.resolve(
          "./components/src/index.module.css"
        ),
        "@opentrons/components": path2.resolve("./components/src/index.ts"),
        "@opentrons/shared-data/pipette/fixtures/name": path2.resolve(
          "./shared-data/pipette/fixtures/name/index.ts"
        ),
        "@opentrons/shared-data/labware/fixtures/1": path2.resolve(
          "./shared-data/labware/fixtures/1/index.ts"
        ),
        "@opentrons/shared-data/labware/fixtures/2": path2.resolve(
          "./shared-data/labware/fixtures/2/index.ts"
        ),
        "@opentrons/shared-data/labware/fixtures/3": path2.resolve(
          "./shared-data/labware/fixtures/3/index.ts"
        ),
        "@opentrons/shared-data": path2.resolve("./shared-data/js/index.ts"),
        "@opentrons/step-generation": path2.resolve(
          "./step-generation/src/index.ts"
        ),
        "@opentrons/api-client": path2.resolve("./api-client/src/index.ts"),
        "@opentrons/react-api-client": path2.resolve(
          "./react-api-client/src/index.ts"
        ),
        "@opentrons/discovery-client": path2.resolve(
          "./discovery-client/src/index.ts"
        ),
        "@opentrons/usb-bridge/node-client": path2.resolve(
          "./usb-bridge/node-client/src/index.ts"
        ),
        "@opentrons/labware-library": path2.resolve(
          "./labware-library/src/labware-creator/index.tsx"
        ),
        // "The resulting path (...) trailing slashes are removed unless the path is resolved to the root directory."
        // https://nodejs.org/api/path.html#pathresolvepaths
        "/app/": path2.resolve("./app/src/") + "/"
      }
    }
  })
);
export {
  vitest_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy5tdHMiLCAidml0ZS5jb25maWcubXRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL2plYXRoYXJ5cmFkYXIvb3BlbnRyb25zXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvamVhdGhhcnlyYWRhci9vcGVudHJvbnMvdml0ZXN0LmNvbmZpZy5tdHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2plYXRoYXJ5cmFkYXIvb3BlbnRyb25zL3ZpdGVzdC5jb25maWcubXRzXCI7LyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L3RyaXBsZS1zbGFzaC1yZWZlcmVuY2UgKi9cbi8vLyA8cmVmZXJlbmNlIHR5cGVzPVwidml0ZXN0XCIgLz5cbi8vLyA8cmVmZXJlbmNlIHR5cGVzPVwidml0ZS9jbGllbnRcIiAvPlxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCB7IGNvbmZpZ0RlZmF1bHRzLCBkZWZpbmVDb25maWcsIG1lcmdlQ29uZmlnIH0gZnJvbSAndml0ZXN0L2NvbmZpZydcbmltcG9ydCB2aXRlQ29uZmlnIGZyb20gJy4vdml0ZS5jb25maWcubXRzJ1xuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgaW1wb3J0L25vLWRlZmF1bHQtZXhwb3J0XG5leHBvcnQgZGVmYXVsdCBtZXJnZUNvbmZpZyhcbiAgdml0ZUNvbmZpZyxcbiAgZGVmaW5lQ29uZmlnKHtcbiAgICB0ZXN0OiB7XG4gICAgICBlbnZpcm9ubWVudDogJ2pzZG9tJyxcbiAgICAgIGFsbG93T25seTogdHJ1ZSxcbiAgICAgIGV4Y2x1ZGU6IFsuLi5jb25maWdEZWZhdWx0cy5leGNsdWRlLCAnKiovbm9kZV9tb2R1bGVzLyoqJywgJyoqL2Rpc3QvKionXSxcbiAgICAgIHNldHVwRmlsZXM6IFsnLi9zZXR1cC12aXRlc3QubXRzJ10sXG4gICAgICBjb3ZlcmFnZToge1xuICAgICAgICBleGNsdWRlOiBbJyoqL25vZGVfbW9kdWxlcy8qKicsICcqKi9kaXN0LyoqJywgJyoqL19fdGVzdHNfXy8qKicsICdwcm90b2NvbC1kZXNpZ25lci9jeXByZXNzLyoqLyonLCAnbGFid2FyZS1saWJyYXJ5L2N5cHJlc3MvKiovKicsIC4uLmNvbmZpZ0RlZmF1bHRzLmV4Y2x1ZGVdLFxuICAgICAgICBwcm92aWRlcjogJ3Y4JyxcbiAgICAgICAgcmVwb3J0ZXI6IFsndGV4dCcsICdqc29uJywgJ2h0bWwnLCAnbGNvdiddLFxuICAgICAgfSxcbiAgICB9LFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgICdAb3BlbnRyb25zL2NvbXBvbmVudHMvc3R5bGVzJzogcGF0aC5yZXNvbHZlKFxuICAgICAgICAgICcuL2NvbXBvbmVudHMvc3JjL2luZGV4Lm1vZHVsZS5jc3MnXG4gICAgICAgICksXG4gICAgICAgICdAb3BlbnRyb25zL2NvbXBvbmVudHMnOiBwYXRoLnJlc29sdmUoJy4vY29tcG9uZW50cy9zcmMvaW5kZXgudHMnKSxcbiAgICAgICAgJ0BvcGVudHJvbnMvc2hhcmVkLWRhdGEvcGlwZXR0ZS9maXh0dXJlcy9uYW1lJzogcGF0aC5yZXNvbHZlKFxuICAgICAgICAgICcuL3NoYXJlZC1kYXRhL3BpcGV0dGUvZml4dHVyZXMvbmFtZS9pbmRleC50cydcbiAgICAgICAgKSxcbiAgICAgICAgJ0BvcGVudHJvbnMvc2hhcmVkLWRhdGEvbGFid2FyZS9maXh0dXJlcy8xJzogcGF0aC5yZXNvbHZlKFxuICAgICAgICAgICcuL3NoYXJlZC1kYXRhL2xhYndhcmUvZml4dHVyZXMvMS9pbmRleC50cydcbiAgICAgICAgKSxcbiAgICAgICAgJ0BvcGVudHJvbnMvc2hhcmVkLWRhdGEvbGFid2FyZS9maXh0dXJlcy8yJzogcGF0aC5yZXNvbHZlKFxuICAgICAgICAgICcuL3NoYXJlZC1kYXRhL2xhYndhcmUvZml4dHVyZXMvMi9pbmRleC50cydcbiAgICAgICAgKSxcbiAgICAgICAgJ0BvcGVudHJvbnMvc2hhcmVkLWRhdGEvbGFid2FyZS9maXh0dXJlcy8zJzogcGF0aC5yZXNvbHZlKFxuICAgICAgICAgICcuL3NoYXJlZC1kYXRhL2xhYndhcmUvZml4dHVyZXMvMy9pbmRleC50cydcbiAgICAgICAgKSxcbiAgICAgICAgJ0BvcGVudHJvbnMvc2hhcmVkLWRhdGEnOiBwYXRoLnJlc29sdmUoJy4vc2hhcmVkLWRhdGEvanMvaW5kZXgudHMnKSxcbiAgICAgICAgJ0BvcGVudHJvbnMvc3RlcC1nZW5lcmF0aW9uJzogcGF0aC5yZXNvbHZlKFxuICAgICAgICAgICcuL3N0ZXAtZ2VuZXJhdGlvbi9zcmMvaW5kZXgudHMnXG4gICAgICAgICksXG4gICAgICAgICdAb3BlbnRyb25zL2FwaS1jbGllbnQnOiBwYXRoLnJlc29sdmUoJy4vYXBpLWNsaWVudC9zcmMvaW5kZXgudHMnKSxcbiAgICAgICAgJ0BvcGVudHJvbnMvcmVhY3QtYXBpLWNsaWVudCc6IHBhdGgucmVzb2x2ZShcbiAgICAgICAgICAnLi9yZWFjdC1hcGktY2xpZW50L3NyYy9pbmRleC50cydcbiAgICAgICAgKSxcbiAgICAgICAgJ0BvcGVudHJvbnMvZGlzY292ZXJ5LWNsaWVudCc6IHBhdGgucmVzb2x2ZShcbiAgICAgICAgICAnLi9kaXNjb3ZlcnktY2xpZW50L3NyYy9pbmRleC50cydcbiAgICAgICAgKSxcbiAgICAgICAgJ0BvcGVudHJvbnMvdXNiLWJyaWRnZS9ub2RlLWNsaWVudCc6IHBhdGgucmVzb2x2ZShcbiAgICAgICAgICAnLi91c2ItYnJpZGdlL25vZGUtY2xpZW50L3NyYy9pbmRleC50cydcbiAgICAgICAgKSxcbiAgICAgICAgJ0BvcGVudHJvbnMvbGFid2FyZS1saWJyYXJ5JzogcGF0aC5yZXNvbHZlKFxuICAgICAgICAgICcuL2xhYndhcmUtbGlicmFyeS9zcmMvbGFid2FyZS1jcmVhdG9yL2luZGV4LnRzeCdcbiAgICAgICAgKSxcbiAgICAgICAgLy8gXCJUaGUgcmVzdWx0aW5nIHBhdGggKC4uLikgdHJhaWxpbmcgc2xhc2hlcyBhcmUgcmVtb3ZlZCB1bmxlc3MgdGhlIHBhdGggaXMgcmVzb2x2ZWQgdG8gdGhlIHJvb3QgZGlyZWN0b3J5LlwiXG4gICAgICAgIC8vIGh0dHBzOi8vbm9kZWpzLm9yZy9hcGkvcGF0aC5odG1sI3BhdGhyZXNvbHZlcGF0aHNcbiAgICAgICAgJy9hcHAvJzogcGF0aC5yZXNvbHZlKCcuL2FwcC9zcmMvJykgKyAnLycsXG4gICAgICB9LFxuICAgIH0sXG4gIH0pXG4pXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9qZWF0aGFyeXJhZGFyL29wZW50cm9uc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2plYXRoYXJ5cmFkYXIvb3BlbnRyb25zL3ZpdGUuY29uZmlnLm10c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvamVhdGhhcnlyYWRhci9vcGVudHJvbnMvdml0ZS5jb25maWcubXRzXCI7Ly8vIDxyZWZlcmVuY2UgdHlwZXM9XCJ2aXRlc3RcIiAvPlxuLy8vIDxyZWZlcmVuY2UgdHlwZXM9XCJ2aXRlL2NsaWVudFwiIC8+XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcbmltcG9ydCBwb3N0Q3NzSW1wb3J0IGZyb20gJ3Bvc3Rjc3MtaW1wb3J0J1xuaW1wb3J0IHBvc3RDc3NBcHBseSBmcm9tICdwb3N0Y3NzLWFwcGx5J1xuaW1wb3J0IHBvc3RDb2xvck1vZEZ1bmN0aW9uIGZyb20gJ3Bvc3Rjc3MtY29sb3ItbW9kLWZ1bmN0aW9uJ1xuaW1wb3J0IHBvc3RDc3NQcmVzZXRFbnYgZnJvbSAncG9zdGNzcy1wcmVzZXQtZW52J1xuaW1wb3J0IGxvc3RDc3MgZnJvbSAnbG9zdCdcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgYnVpbGQ6IHtcbiAgICAvLyBSZWxhdGl2ZSB0byB0aGUgcm9vdFxuICAgIG91dERpcjogJ2Rpc3QnLFxuICB9LFxuICBwbHVnaW5zOiBbXG4gICAgcmVhY3Qoe1xuICAgICAgaW5jbHVkZTogJyoqLyoudHN4JyxcbiAgICAgIGJhYmVsOiB7XG4gICAgICAgIC8vIFVzZSBiYWJlbC5jb25maWcuanMgZmlsZXNcbiAgICAgICAgY29uZmlnRmlsZTogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSksXG4gIF0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGVzYnVpbGRPcHRpb25zOiB7XG4gICAgICB0YXJnZXQ6ICdlczIwMjAnLFxuICAgIH0sXG4gICAgZXhjbHVkZTogWydub2RlX21vZHVsZXMnXSxcbiAgfSxcbiAgY3NzOiB7XG4gICAgcG9zdGNzczoge1xuICAgICAgcGx1Z2luczogW1xuICAgICAgICBwb3N0Q3NzSW1wb3J0KHsgcm9vdDogJ3NyYy8nIH0pLFxuICAgICAgICBwb3N0Q3NzQXBwbHkoKSxcbiAgICAgICAgcG9zdENvbG9yTW9kRnVuY3Rpb24oKSxcbiAgICAgICAgcG9zdENzc1ByZXNldEVudih7IHN0YWdlOiAwIH0pLFxuICAgICAgICBsb3N0Q3NzKCksXG4gICAgICBdLFxuICAgIH0sXG4gIH0sXG4gIGRlZmluZToge1xuICAgICdwcm9jZXNzLmVudic6IHByb2Nlc3MuZW52LFxuICAgIGdsb2JhbDogJ2dsb2JhbFRoaXMnLFxuICB9LFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAb3BlbnRyb25zL2NvbXBvbmVudHMvc3R5bGVzJzogcGF0aC5yZXNvbHZlKFxuICAgICAgICAnLi9jb21wb25lbnRzL3NyYy9pbmRleC5tb2R1bGUuY3NzJ1xuICAgICAgKSxcbiAgICAgICdAb3BlbnRyb25zL2NvbXBvbmVudHMnOiBwYXRoLnJlc29sdmUoJy4vY29tcG9uZW50cy9zcmMvaW5kZXgudHMnKSxcbiAgICAgICdAb3BlbnRyb25zL3NoYXJlZC1kYXRhL3BpcGV0dGUvZml4dHVyZXMvbmFtZSc6IHBhdGgucmVzb2x2ZShcbiAgICAgICAgJy4vc2hhcmVkLWRhdGEvcGlwZXR0ZS9maXh0dXJlcy9uYW1lL2luZGV4LnRzJ1xuICAgICAgKSxcbiAgICAgICdAb3BlbnRyb25zL3NoYXJlZC1kYXRhL2xhYndhcmUvZml4dHVyZXMvMSc6IHBhdGgucmVzb2x2ZShcbiAgICAgICAgJy4vc2hhcmVkLWRhdGEvbGFid2FyZS9maXh0dXJlcy8xL2luZGV4LnRzJ1xuICAgICAgKSxcbiAgICAgICdAb3BlbnRyb25zL3NoYXJlZC1kYXRhL2xhYndhcmUvZml4dHVyZXMvMic6IHBhdGgucmVzb2x2ZShcbiAgICAgICAgJy4vc2hhcmVkLWRhdGEvbGFid2FyZS9maXh0dXJlcy8yL2luZGV4LnRzJ1xuICAgICAgKSxcbiAgICAgICdAb3BlbnRyb25zL3NoYXJlZC1kYXRhL2xhYndhcmUvZml4dHVyZXMvMyc6IHBhdGgucmVzb2x2ZShcbiAgICAgICAgJy4vc2hhcmVkLWRhdGEvbGFid2FyZS9maXh0dXJlcy8zL2luZGV4LnRzJ1xuICAgICAgKSxcbiAgICAgICdAb3BlbnRyb25zL3NoYXJlZC1kYXRhJzogcGF0aC5yZXNvbHZlKCcuL3NoYXJlZC1kYXRhL2pzL2luZGV4LnRzJyksXG4gICAgICAnQG9wZW50cm9ucy9zdGVwLWdlbmVyYXRpb24nOiBwYXRoLnJlc29sdmUoXG4gICAgICAgICcuL3N0ZXAtZ2VuZXJhdGlvbi9zcmMvaW5kZXgudHMnXG4gICAgICApLFxuICAgICAgJy9hcHAvJzogcGF0aC5yZXNvbHZlKCcuL2FwcC9zcmMvJykgKyAnLycsXG4gICAgfSxcbiAgfSxcbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBR0EsT0FBT0EsV0FBVTtBQUNqQixTQUFTLGdCQUFnQixnQkFBQUMsZUFBYyxtQkFBbUI7OztBQ0YxRCxPQUFPLFVBQVU7QUFDakIsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sbUJBQW1CO0FBQzFCLE9BQU8sa0JBQWtCO0FBQ3pCLE9BQU8sMEJBQTBCO0FBQ2pDLE9BQU8sc0JBQXNCO0FBQzdCLE9BQU8sYUFBYTtBQUVwQixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixPQUFPO0FBQUE7QUFBQSxJQUVMLFFBQVE7QUFBQSxFQUNWO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsTUFDSixTQUFTO0FBQUEsTUFDVCxPQUFPO0FBQUE7QUFBQSxRQUVMLFlBQVk7QUFBQSxNQUNkO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1osZ0JBQWdCO0FBQUEsTUFDZCxRQUFRO0FBQUEsSUFDVjtBQUFBLElBQ0EsU0FBUyxDQUFDLGNBQWM7QUFBQSxFQUMxQjtBQUFBLEVBQ0EsS0FBSztBQUFBLElBQ0gsU0FBUztBQUFBLE1BQ1AsU0FBUztBQUFBLFFBQ1AsY0FBYyxFQUFFLE1BQU0sT0FBTyxDQUFDO0FBQUEsUUFDOUIsYUFBYTtBQUFBLFFBQ2IscUJBQXFCO0FBQUEsUUFDckIsaUJBQWlCLEVBQUUsT0FBTyxFQUFFLENBQUM7QUFBQSxRQUM3QixRQUFRO0FBQUEsTUFDVjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixlQUFlLFFBQVE7QUFBQSxJQUN2QixRQUFRO0FBQUEsRUFDVjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsZ0NBQWdDLEtBQUs7QUFBQSxRQUNuQztBQUFBLE1BQ0Y7QUFBQSxNQUNBLHlCQUF5QixLQUFLLFFBQVEsMkJBQTJCO0FBQUEsTUFDakUsZ0RBQWdELEtBQUs7QUFBQSxRQUNuRDtBQUFBLE1BQ0Y7QUFBQSxNQUNBLDZDQUE2QyxLQUFLO0FBQUEsUUFDaEQ7QUFBQSxNQUNGO0FBQUEsTUFDQSw2Q0FBNkMsS0FBSztBQUFBLFFBQ2hEO0FBQUEsTUFDRjtBQUFBLE1BQ0EsNkNBQTZDLEtBQUs7QUFBQSxRQUNoRDtBQUFBLE1BQ0Y7QUFBQSxNQUNBLDBCQUEwQixLQUFLLFFBQVEsMkJBQTJCO0FBQUEsTUFDbEUsOEJBQThCLEtBQUs7QUFBQSxRQUNqQztBQUFBLE1BQ0Y7QUFBQSxNQUNBLFNBQVMsS0FBSyxRQUFRLFlBQVksSUFBSTtBQUFBLElBQ3hDO0FBQUEsRUFDRjtBQUNGLENBQUM7OztBRC9ERCxJQUFPLHdCQUFRO0FBQUEsRUFDYjtBQUFBLEVBQ0FDLGNBQWE7QUFBQSxJQUNYLE1BQU07QUFBQSxNQUNKLGFBQWE7QUFBQSxNQUNiLFdBQVc7QUFBQSxNQUNYLFNBQVMsQ0FBQyxHQUFHLGVBQWUsU0FBUyxzQkFBc0IsWUFBWTtBQUFBLE1BQ3ZFLFlBQVksQ0FBQyxvQkFBb0I7QUFBQSxNQUNqQyxVQUFVO0FBQUEsUUFDUixTQUFTLENBQUMsc0JBQXNCLGNBQWMsbUJBQW1CLGtDQUFrQyxnQ0FBZ0MsR0FBRyxlQUFlLE9BQU87QUFBQSxRQUM1SixVQUFVO0FBQUEsUUFDVixVQUFVLENBQUMsUUFBUSxRQUFRLFFBQVEsTUFBTTtBQUFBLE1BQzNDO0FBQUEsSUFDRjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsT0FBTztBQUFBLFFBQ0wsZ0NBQWdDQyxNQUFLO0FBQUEsVUFDbkM7QUFBQSxRQUNGO0FBQUEsUUFDQSx5QkFBeUJBLE1BQUssUUFBUSwyQkFBMkI7QUFBQSxRQUNqRSxnREFBZ0RBLE1BQUs7QUFBQSxVQUNuRDtBQUFBLFFBQ0Y7QUFBQSxRQUNBLDZDQUE2Q0EsTUFBSztBQUFBLFVBQ2hEO0FBQUEsUUFDRjtBQUFBLFFBQ0EsNkNBQTZDQSxNQUFLO0FBQUEsVUFDaEQ7QUFBQSxRQUNGO0FBQUEsUUFDQSw2Q0FBNkNBLE1BQUs7QUFBQSxVQUNoRDtBQUFBLFFBQ0Y7QUFBQSxRQUNBLDBCQUEwQkEsTUFBSyxRQUFRLDJCQUEyQjtBQUFBLFFBQ2xFLDhCQUE4QkEsTUFBSztBQUFBLFVBQ2pDO0FBQUEsUUFDRjtBQUFBLFFBQ0EseUJBQXlCQSxNQUFLLFFBQVEsMkJBQTJCO0FBQUEsUUFDakUsK0JBQStCQSxNQUFLO0FBQUEsVUFDbEM7QUFBQSxRQUNGO0FBQUEsUUFDQSwrQkFBK0JBLE1BQUs7QUFBQSxVQUNsQztBQUFBLFFBQ0Y7QUFBQSxRQUNBLHFDQUFxQ0EsTUFBSztBQUFBLFVBQ3hDO0FBQUEsUUFDRjtBQUFBLFFBQ0EsOEJBQThCQSxNQUFLO0FBQUEsVUFDakM7QUFBQSxRQUNGO0FBQUE7QUFBQTtBQUFBLFFBR0EsU0FBU0EsTUFBSyxRQUFRLFlBQVksSUFBSTtBQUFBLE1BQ3hDO0FBQUEsSUFDRjtBQUFBLEVBQ0YsQ0FBQztBQUNIOyIsCiAgIm5hbWVzIjogWyJwYXRoIiwgImRlZmluZUNvbmZpZyIsICJkZWZpbmVDb25maWciLCAicGF0aCJdCn0K
