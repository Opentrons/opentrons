// shareable pieces of webpack configuration
'use strict'

const envConstants = require('./lib/env')

module.exports = Object.assign(
  {
    baseConfig: require('./lib/base-config'),
    nodeBaseConfig: require('./lib/node-base-config'),
    rules: require('./lib/rules'),
  },
  envConstants
)
