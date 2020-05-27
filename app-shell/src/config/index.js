// @flow
// app configuration and settings
// TODO(mc, 2020-01-31): this module is high-importance and needs unit tests
import Store from 'electron-store'
import mergeOptions from 'merge-options'
import { getIn, exists } from '@thi.ng/paths'
import yargsParser from 'yargs-parser'

import * as Cfg from '@opentrons/app/src/config'

import { createLogger } from '../log'
import { DEFAULTS, migrate } from './migrate'

import type { Config } from '@opentrons/app/src/config/types'
import type { Action, Dispatch } from '../types'

export type { Config }

// make sure all arguments are included in production
const argv =
  'defaultApp' in process ? process.argv.slice(2) : process.argv.slice(1)

const PARSE_ARGS_OPTS = {
  envPrefix: 'OT_APP',
  configuration: {
    'negation-prefix': 'disable_',
  },
}

// lazy load store, overrides, and log because of config/log interdependency
let _store
let _over
let _log
const store = () => {
  if (_store == null) {
    // perform store migration if loading for the first time
    _store = new Store({ defaults: DEFAULTS })
    _store.store = migrate(_store.store)
  }
  return _store
}
const overrides = () => _over || (_over = yargsParser(argv, PARSE_ARGS_OPTS))
const log = () => _log || (_log = createLogger('config'))

// initialize and register the config module with dispatches from the UI
export function registerConfig(dispatch: Dispatch) {
  return function handleIncomingAction(action: Action) {
    if (action.type === Cfg.UPDATE || action.type === Cfg.RESET) {
      const { path } = action.payload
      const value =
        action.type === Cfg.UPDATE
          ? action.payload.value
          : getIn(DEFAULTS, path)

      log().debug('Handling config update', { path, value })

      if (exists(overrides(), path)) {
        log().debug(`${path} in overrides; not updating`)
      } else {
        log().debug(`Updating "${path}" to ${value}`)
        store().set(path, value)
        dispatch({ type: 'config:SET', payload: { path, value } })
      }
    }
  }
}

export function getStore() {
  return store().store
}

export function getOverrides(path?: string) {
  return getIn(overrides(), path)
}

// TODO(mc, 2010-07-01): getConfig with path parameter can't be typed
// Remove the path parameter
export function getConfig(path?: string) {
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

export function getFullConfig(): Config {
  return getConfig()
}

export function handleConfigChange(
  path: string,
  changeHandler: (newValue: any, oldValue: any) => mixed
) {
  store().onDidChange(path, changeHandler)
}
