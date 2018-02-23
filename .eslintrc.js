module.exports = {
  parser: 'babel-eslint',

  extends: [
    'standard'
    // TODO(mc, 2018-02-10): plugin:react/recommended
    // TODO(mc, 2018-02-10): plugin:flowtype/recommended
  ],

  plugins: [
    'flowtype',
    'react'
  ],

  rules: {
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'error'
  },

  globals: {
    SyntheticEvent: true,
    SyntheticMouseEvent: true,
    SyntheticInputEvent: true,
    $Keys: true,
    $Values: true,
    $Call: true,
    $PropertyType: true,
    Class: true
  },

  env: {
    node: true,
    browser: true,
    jest: true
  }
}
