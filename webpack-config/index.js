// shareable pieces of webpack configuration
'use strict'

module.exports = {
  DEV_MODE: require('./lib/dev-mode'),
  baseConfig: require('./lib/base-config'),
  rules: require('./lib/rules'),
}
