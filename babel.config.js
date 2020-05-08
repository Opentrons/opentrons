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
  plugins: ['@babel/plugin-proposal-class-properties'],
  presets: [
    '@babel/preset-flow',
    '@babel/preset-react',
    ['@babel/preset-env', { modules: false, useBuiltIns: false }],
  ],
  overrides: [
    {
      test: 'app-shell/**/*',
      plugins: [['react-hot-loader/babel', false]],
      presets: [['@babel/preset-env', { targets: { electron: '6' } }]],
    },
    {
      test: ['discovery-client/**/*'],
      plugins: [['react-hot-loader/babel', false]],
      presets: [['@babel/preset-env', { targets: { node: '8' } }]],
    },
    // app that should be polyfilled
    // these projects require `core-js` in their package.json `dependencies`
    {
      test: ['app/**/*', 'labware-library/**/*', 'protocol-designer/**/*'],
      presets: [['@babel/preset-env', { useBuiltIns: 'usage', corejs: 3 }]],
    },
  ],
}
