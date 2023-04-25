'use strict'

module.exports = {
  env: {
    // Note(isk: 3/2/20): Must have babel-plugin-styled-components in each env,
    // see here for further details: s https://styled-components.com/docs/tooling#babel-plugin
    production: {
      plugins: ['babel-plugin-styled-components', 'babel-plugin-unassert'],
    },
    development: {
      plugins: ['babel-plugin-styled-components', 'react-hot-loader/babel'],
    },
    test: {
      plugins: [
        // NOTE(mc, 2020-05-08): disable ssr, displayName to fix toHaveStyleRule
        // https://github.com/styled-components/jest-styled-components/issues/294
        ['babel-plugin-styled-components', { ssr: false, displayName: false }],
        '@babel/plugin-transform-modules-commonjs',
        'babel-plugin-dynamic-import-node',
      ],
    },
  },
  plugins: [
    // ensure TS files are transpiled prior to running additional class-related plugins
    // allows use of declare keyword
    ['@babel/plugin-transform-typescript', { allowDeclareFields: true }],
    '@babel/plugin-proposal-class-properties',
    // ensure opentrons packages written in TS resolve to source code in
    // unit tests and bundling by rewriting import statements with babel
    [
      'babel-plugin-module-resolver',
      {
        alias: {
          '^@opentrons/discovery-client$': `@opentrons/discovery-client/src/index.ts`,
          '^@opentrons/components$': `@opentrons/components/src/index.ts`,
          '^@opentrons/shared-data$': `@opentrons/shared-data/js/index.ts`,
          '^@opentrons/step-generation$': `@opentrons/step-generation/src/index.ts`,
          '^@opentrons/api-client$': `@opentrons/api-client/src/index.ts`,
          '^@opentrons/react-api-client$': `@opentrons/react-api-client/src/index.ts`,
          '^@opentrons/usb-bridge/node-client$': `@opentrons/usb-bridge/node-client/src/index.ts`,
        },
      },
    ],
  ],
  presets: [
    '@babel/preset-react',
    ['@babel/preset-env', { modules: false, useBuiltIns: false }],
  ],
  overrides: [
    {
      test: ['**/*.ts', '**/*.tsx'],
      presets: ['@babel/preset-typescript'],
    },
    {
      test: 'app-shell/**/*',
      plugins: [['react-hot-loader/babel', false]],
      presets: [['@babel/preset-env', { targets: { electron: '6' } }]],
    },
    {
      test: 'app-shell-odd/**/*',
      plugins: [['react-hot-loader/babel', false]],
      presets: [['@babel/preset-env', { targets: { electron: '6' } }]],
    },
    {
      test: ['discovery-client/**/*'],
      plugins: [['react-hot-loader/babel', false]],
      presets: [['@babel/preset-env', { targets: { node: '8' } }]],
    },
    // apps that should be polyfilled
    // these projects require `core-js` in their package.json `dependencies`
    {
      test: [
        'app/**/*',
        'labware-library/**/*',
        'protocol-designer/**/*',
        'react-api-client/**/*',
        'api-client/**/*',
      ],
      presets: [['@babel/preset-env', { useBuiltIns: 'usage', corejs: 3 }]],
    },
  ],
}
