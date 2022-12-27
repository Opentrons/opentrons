import semver from 'semver'
import { UI_INITIALIZED } from '@opentrons/app/src/redux/shell/actions'
import { createLogger } from './log'
import { getConfig } from './config'
import { fetchJson } from './http'

import type { Action, Dispatch } from './types'
import type { ReleaseManifest } from './system-update/types'

const log = createLogger('update')

let LATEST_OT_SYSTEM_VERSION = _PKG_VERSION_

export const updateLatestVersion = (): Promise<string> => {
  const manifestURL = getConfig('robotSystemUpdate').manifestUrls.OT3
  const channel = getConfig('update').channel

  const channelFinder = (version: string): boolean => {
    // return the latest alpha/beta if a user subscribes to alpha/beta updates
    if (['alpha', 'beta'].includes(channel)) {
      return version.includes(channel)
    } else {
      // otherwise get the latest stable version
      return !version.includes('alpha') && !version.includes('beta')
    }
  }

  return fetchJson<ReleaseManifest>(manifestURL)
    .then(response => {
      const lastestAvailableVersion =
        Object.keys(response.production)
          .map(version => version)
          .sort((a, b) => {
            if (semver.lt(a, b)) {
              return 1
            }
            return -1
          })
          .find(channelFinder) ?? _PKG_VERSION_
      LATEST_OT_SYSTEM_VERSION = lastestAvailableVersion
      return LATEST_OT_SYSTEM_VERSION
    })
    .catch((e: Error) => {
      log.warn(`error fetching latest system version: ${e.message}`)
      return _PKG_VERSION_
    })
}

export const getLatestVersion = (): string => {
  return LATEST_OT_SYSTEM_VERSION
}

export function registerUpdate(
  dispatch: Dispatch
): (action: Action) => unknown {
  return function handleAction(action: Action) {
    switch (action.type) {
      case UI_INITIALIZED:
      case 'shell:CHECK_UPDATE':
        return updateLatestVersion()
    }
  }
}
