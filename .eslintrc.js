module.exports = {
  parser: 'babel-eslint',

  extends: [
    'standard',
    // TODO(mc, 2018-02-10): plugin:react/recommended
    'plugin:flowtype/recommended'
  ],

  plugins: [
    'flowtype',
    'react'
  ],

  rules: {
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'error',
    'camelcase': {properties: 'never', ignoreDestructuring: true}
  },

  globals: {},

  env: {
    node: true,
    browser: true,
    jest: true
  }
}
