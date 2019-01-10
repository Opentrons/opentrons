// shareable pieces of webpack configuration
'use strict'

const envConstants = require('./lib/env')

module.exports = Object.assign(
  {
    baseConfig: require('./lib/base-config'),
    rules: require('./lib/rules'),
  },
  envConstants
)
