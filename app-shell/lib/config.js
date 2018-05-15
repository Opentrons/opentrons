// app configuration and settings
// TODO(mc, 2018-05-15): implement this module properly
'use strict'

const path = require('path')
const url = require('url')

// TODO(mc, 2018-05-15): "properly" means features, not DEV_MODE / DEBUG
const DEV_MODE = process.env.NODE_ENV === 'development'
const DEBUG_MODE = process.env.DEBUG

module.exports = {
  DEV_MODE,
  DEBUG_MODE,

  // logging config
  log: {
    level: {
      file: 'debug',
      console: 'info'
    }
  },

  // ui config
  ui: {
    width: 1024,
    height: 768,
    url: DEV_MODE
      ? `http://localhost:${process.env.PORT}`
      : url.resolve('file://', path.join(__dirname, '../ui/index.html'))
  }
}
