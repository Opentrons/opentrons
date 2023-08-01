import semver from 'semver'
import { UI_INITIALIZED } from '@opentrons/app/src/redux/shell/actions'
import { createLogger } from './log'
import { getConfig } from './config'
import {
  downloadAndCacheReleaseManifest,
  getCachedReleaseManifest,
  getReleaseSet,
} from './system-update/release-manifest'

import type { Action, Dispatch } from './types'
import type { ReleaseSetUrls } from './system-update/types'

const log = createLogger('update')

export const FLEX_MANIFEST_URL = _OPENTRONS_PROJECT_.includes('robot-stack')
  ? 'https://builds.opentrons.com/ot3-oe/releases.json'
  : 'https://ot3-development.builds.opentrons.com/ot3-oe/releases.json'

let LATEST_OT_SYSTEM_VERSION = _PKG_VERSION_

const channelFinder = (version: string, channel: string): boolean => {
  // return the latest alpha/beta if a user subscribes to alpha/beta updates
  if (['alpha', 'beta'].includes(channel)) {
    return version.includes(channel)
  } else {
    // otherwise get the latest stable version
    return !version.includes('alpha') && !version.includes('beta')
  }
}

export const getLatestSystemUpdateUrls = (): Promise<ReleaseSetUrls | null> => {
  return getCachedReleaseManifest()
    .then(manifest => getReleaseSet(manifest, getLatestVersion()))
    .catch((error: Error) => {
      log.warn('Error retrieving release manifest', {
        version: getLatestVersion(),
        error,
      })
      return Promise.reject(error)
    })
}

export const updateLatestVersion = (): Promise<string> => {
  const channel = getConfig('update').channel

  return downloadAndCacheReleaseManifest(FLEX_MANIFEST_URL)
    .then(response => {
      const latestAvailableVersion = Object.keys(response.production)
        .sort((a, b) => {
          if (semver.lt(a, b)) {
            return 1
          }
          return -1
        })
        .find(verson => channelFinder(verson, channel))

      LATEST_OT_SYSTEM_VERSION = latestAvailableVersion ?? _PKG_VERSION_
      return LATEST_OT_SYSTEM_VERSION
    })
    .catch((e: Error) => {
      log.warn(`error fetching latest system version: ${e.message}`)
      return LATEST_OT_SYSTEM_VERSION
    })
}

export const getLatestVersion = (): string => {
  return LATEST_OT_SYSTEM_VERSION
}

export const getCurrentVersion = (): string => _PKG_VERSION_

export const isUpdateAvailable = (): boolean =>
  getLatestVersion() !== getCurrentVersion()

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
