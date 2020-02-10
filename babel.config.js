'use strict'

module.exports = {
  env: {
    production: {
      plugins: ['babel-plugin-unassert'],
    },
    development: {
      plugins: ['react-hot-loader/babel'],
    },
    test: {
      plugins: [
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
