"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference types="vitest" />
/// <reference types="vite/client" />
var path_1 = require("path");
var vite_1 = require("vite");
var plugin_react_1 = require("@vitejs/plugin-react");
var postcss_import_1 = require("postcss-import");
var postcss_apply_1 = require("postcss-apply");
var postcss_color_mod_function_1 = require("postcss-color-mod-function");
var postcss_preset_env_1 = require("postcss-preset-env");
var lost_1 = require("lost");
exports.default = (0, vite_1.defineConfig)({
    build: {
        // Relative to the root
        outDir: 'dist',
    },
    plugins: [
        (0, plugin_react_1.default)({
            include: '**/*.tsx',
            babel: {
                // Use babel.config.js files
                configFile: true,
            },
        }),
    ],
    optimizeDeps: {
        esbuildOptions: {
            target: 'es2020',
        },
    },
    css: {
        postcss: {
            plugins: [
                (0, postcss_import_1.default)({ root: 'src/' }),
                (0, postcss_apply_1.default)(),
                (0, postcss_color_mod_function_1.default)(),
                (0, postcss_preset_env_1.default)({ stage: 0 }),
                (0, lost_1.default)(),
            ],
        },
    },
    define: {
        'process.env': process.env,
        global: 'globalThis',
    },
    resolve: {
        alias: {
            '@opentrons/components/styles': "@opentrons/components/src/index.module.css",
            '@opentrons/components': "@opentrons/components/src/index.ts",
            '@opentrons/shared-data': "@opentrons/shared-data/js/index.ts",
            '@opentrons/step-generation': "@opentrons/step-generation/src/index.ts",
            '@opentrons/api-client': "".concat(path_1.default.resolve(__dirname, 'src'), "/index.ts"),
            '@opentrons/react-api-client': "".concat(path_1.default.resolve(__dirname, 'src'), "/index.ts"),
        },
    },
});
