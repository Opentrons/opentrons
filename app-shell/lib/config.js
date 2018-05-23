// app configuration and settings
'use strict'

const Store = require('electron-store')
const {getIn} = require('@thi.ng/paths')
const mergeOptions = require('merge-options')
const yargsParser = require('yargs-parser')

// make sure all arguments are included in production
const argv = process.defaultApp
  ? process.argv.slice(2)
  : process.argv.slice(1)

const PARSE_ARGS_OPTS = {
  envPrefix: 'OT_APP',
  configuration: {
    'negation-prefix': 'disable_'
  }
}

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

let store
let overrides
let log

module.exports = {
  // initialize and register the config module with dispatches from the UI
  registerConfig (dispatch) {
    log = log || require('./log')(__filename)

    return function handleIncomingAction (action) {
      const {type, payload} = action

      if (type === 'config:UPDATE') {
        log.debug('Handling config:UPDATE', payload)

        if (getIn(overrides, payload.path)) {
          log.info(`${payload.path} in overrides; not updating`)
        } else {
          log.info(`Updating "${payload.path}" to ${payload.value}`)
          store.set(payload.path, payload.value)
          dispatch({type: 'config:SET', payload})
        }
      }
    }
  },

  getStore () {
    return store.store
  },

  getOverrides () {
    return overrides
  },

  getConfig (path) {
    store = store || new Store({defaults: DEFAULTS})
    overrides = overrides || yargsParser(argv, PARSE_ARGS_OPTS)

    const result = store.get(path)
    const over = getIn(overrides, path)

    if (over != null) {
      if (typeof result === 'object' && result != null) {
        return mergeOptions(result, over)
      }

      return over
    }

    return result
  }
}
