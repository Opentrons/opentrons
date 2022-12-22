// app updater
import { autoUpdater as updater } from 'electron-updater'

import { UI_INITIALIZED } from '@opentrons/app/src/redux/shell/actions'
import { createLogger } from './log'
import { getConfig } from './config'
import { fetchJson } from './http'

import type { UpdateInfo } from '@opentrons/app/src/redux/shell/types'
import type { Action, Dispatch, PlainError } from './types'
import type { ReleaseManifest } from './system-update/types'
import semver from 'semver'

updater.logger = createLogger('update')

updater.autoDownload = false
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
      console.log('set LATEST_OT_SYSTEM_VERSION to ', LATEST_OT_SYSTEM_VERSION)
      return LATEST_OT_SYSTEM_VERSION
    })
    .catch((e: Error) => {
      console.log(`error sorting update versions: ${e.message}`)
      return _PKG_VERSION_
    })
}

// LATEST_OT_SYSTEM_VERSION is instantiated in the preload file, and updated when
// an update is available in the onAvailable callback below
export const getLatestVersion = (): string => {
  console.log('latest version is', LATEST_OT_SYSTEM_VERSION)
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
