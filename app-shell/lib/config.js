// app configuration and settings
'use strict'

const Store = require('electron-store')
const mergeOptions = require('merge-options')
const {getIn} = require('@thi.ng/paths')
const uuid = require('uuid/v4')
const yargsParser = require('yargs-parser')

const {version} = require('../package.json')

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

// TODO(mc, 2018-05-25): future config changes may require migration strategy
const DEFAULTS = {
  devtools: false,

  modules: false,

  // app update config
  update: {
    channel: version.includes('beta') ? 'beta' : 'latest'
  },

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
  },

  // analytics (mixpanel)
  analytics: {
    appId: uuid(),
    optedIn: false,
    seenOptIn: false
  },

  // user support (intercom)
  support: {
    userId: uuid(),
    createdAt: Math.floor(Date.now() / 1000),
    name: 'Unknown User',
    email: null
  }
}

// lazy load store, overrides, and log because of config/log interdependency
let _store
let _overrides
let _log
const store = () => _store || new Store({defaults: DEFAULTS})
const overrides = () => _overrides || yargsParser(argv, PARSE_ARGS_OPTS)
const log = () => _log || require('./log')(__filename)

module.exports = {
  // initialize and register the config module with dispatches from the UI
  registerConfig (dispatch) {
    return function handleIncomingAction (action) {
      const {type, payload} = action

      if (type === 'config:UPDATE') {
        log().debug('Handling config:UPDATE', payload)

        if (getIn(overrides(), payload.path) != null) {
          log().info(`${payload.path} in overrides; not updating`)
        } else {
          log().info(`Updating "${payload.path}" to ${payload.value}`)
          store().set(payload.path, payload.value)
          dispatch({type: 'config:SET', payload})
        }
      }
    }
  },

  getStore () {
    return store().store
  },

  getOverrides () {
    return overrides()
  },

  getConfig (path) {
    const result = store().get(path)
    const over = getIn(overrides(), path)

    if (over != null) {
      if (typeof result === 'object' && result != null) {
        return mergeOptions(result, over)
      }

      return over
    }

    return result
  }
}
