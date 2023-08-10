// app configuration and settings
// TODO(mc, 2020-01-31): this module is high-importance and needs unit tests
import Store from 'electron-store'
import get from 'lodash/get'
import forEach from 'lodash/forEach'
import mergeOptions from 'merge-options'
import yargsParser from 'yargs-parser'

import { UI_INITIALIZED } from '@opentrons/app/src/redux/shell/actions'
import * as Cfg from '@opentrons/app/src/redux/config'
import systemd from '../systemd'
import { createLogger } from '../log'
import { DEFAULTS_V12, migrate } from './migrate'
import { shouldUpdate, getNextValue } from './update'

import type {
  ConfigV12,
  ConfigValueChangeAction,
} from '@opentrons/app/src/redux/config/types'

import type { Action, Dispatch, Logger } from '../types'
import type { Config, Overrides } from './types'

export * from './types'

export const ODD_DIR = '/data/ODD'

// make sure all arguments are included in production
const argv = process.argv0.endsWith('defaultApp')
  ? process.argv.slice(2)
  : process.argv.slice(1)

const PARSE_ARGS_OPTS = {
  envPrefix: 'OT_APP',
  configuration: {
    'negation-prefix': 'disable_',
  },
}

// lazy load store, overrides, and log because of config/log interdependency
let _store: Store<Config>
let _over: Overrides | undefined
let _log: Logger | undefined

const store = (): Store => {
  if (_store == null) {
    // perform store migration if loading for the first time
    _store = (new Store({
      defaults: DEFAULTS_V12,
      // dont overwrite config dir if in dev mode because it causes issues
      ...(process.env.NODE_ENV === 'production' && { cwd: ODD_DIR }),
    }) as unknown) as Store<Config>
    _store.store = migrate((_store.store as unknown) as ConfigV12)
  }
  return _store
}

const overrides = (): Overrides => {
  return _over ?? (_over = yargsParser(argv, PARSE_ARGS_OPTS))
}

const log = (): Logger => _log ?? (_log = createLogger('config'))

// initialize and register the config module with dispatches from the UI
export function registerConfig(dispatch: Dispatch): (action: Action) => void {
  return function handleIncomingAction(action: Action) {
    if (action.type === UI_INITIALIZED) {
      dispatch(Cfg.configInitialized(getFullConfig()))
    } else if (
      action.type === Cfg.UPDATE_VALUE ||
      action.type === Cfg.RESET_VALUE ||
      action.type === Cfg.TOGGLE_VALUE ||
      action.type === Cfg.ADD_UNIQUE_VALUE ||
      action.type === Cfg.SUBTRACT_VALUE
    ) {
      const { path } = action.payload as { path: string }

      if (shouldUpdate(path, overrides())) {
        const nextValue = getNextValue(
          action as ConfigValueChangeAction,
          getFullConfig()
        )

        if (path === 'devtools') {
          systemd.setRemoteDevToolsEnabled(Boolean(nextValue)).catch(err =>
            log().debug('Something wrong when setting remote dev tools', {
              err,
            })
          )
        }

        // Note (kj:08/03/2023) change touchscreen brightness
        if (path === 'onDeviceDisplaySettings.brightness') {
          systemd.updateBrightness(String(nextValue)).catch(err =>
            log().debug(
              'Something wrong when updating the touchscreen brightness',
              {
                err,
              }
            )
          )
        }

        log().debug('Updating config', { path, nextValue })
        store().set(path, nextValue)
        dispatch(Cfg.configValueUpdated(path, nextValue))
      } else {
        log().debug(`config path in overrides; not updating`, { path })
      }
    }
  }
}

export function getStore(): Config {
  return store().store
}

export function getOverrides(path?: string): unknown {
  return path != null ? get(overrides(), path) : overrides()
}

export function getConfig<P extends keyof Config>(path: P): Config[P]
export function getConfig(): Config
export function getConfig(path?: any): any {
  const result = store().get(path)
  const over = getOverrides(path)

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
  changeHandler: (newValue: any, oldValue: any) => unknown
): void {
  store().onDidChange(path, changeHandler)
}
export function resetStore(): void {
  log().debug('Resetting the store')
  store().clear()
  const migratedConfig = migrate(DEFAULTS_V12)
  forEach(migratedConfig, (configVal, configKey) => {
    store().set(configKey, configVal)
  })
}
