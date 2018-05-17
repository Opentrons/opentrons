// app configuration and settings
'use strict'

const Store = require('electron-store')
const dotProp = require('dot-prop')
const mergeOptions = require('merge-options')
const yargsParser = require('yargs-parser')

// make sure all arguments are included in production
const argv = process.defaultApp
  ? process.argv.slice(2)
  : process.argv.slice(1)

const ENV_PREFIX = 'OT_APP'

const DEFAULTS = {
  devtools: false,

  // logging config
  log: {
    level: {
      file: 'debug',
      console: 'info'
    }
  },

  // ui and browser config
  ui: {
    width: 1024,
    height: 768,
    url: {
      protocol: 'file:',
      path: 'ui/index.html'
    },
    webPreferences: {
      webSecurity: true
    }
  }
}

const overrides = yargsParser(argv, {
  envPrefix: ENV_PREFIX,
  configuration: {
    'negation-prefix': 'disable_'
  }
})

const store = new Store({defaults: DEFAULTS})

module.exports = {get, getStore, getOverrides}

function get (path) {
  const result = store.get(path)
  const over = dotProp.get(overrides, path)

  if (over != null) {
    if (typeof result === 'object' && result != null) {
      return mergeOptions(result, over)
    }

    return over
  }

  return result
}

function getStore () {
  return store.store
}

function getOverrides () {
  return overrides
}
