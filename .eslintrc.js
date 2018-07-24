module.exports = {
  parser: 'babel-eslint',

  extends: [
    'standard',
    'plugin:react/recommended',
    'plugin:flowtype/recommended'
  ],

  plugins: [
    'flowtype',
    'react'
  ],

  rules: {
    'camelcase': [0, {'properties': 'never'}],
    // TODO(mc, 2018-07-24): disabled until fix for crash is released
    // https://github.com/yannickcr/eslint-plugin-react/pull/1860
    'react/prop-types': [0]
  },

  globals: {},

  env: {
    node: true,
    browser: true,
    jest: true
  }
}
