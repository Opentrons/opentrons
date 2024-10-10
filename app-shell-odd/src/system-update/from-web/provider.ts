import path from 'path'
import { rm } from 'fs/promises'

import { createLogger } from '../../log'
import { LocalAbortError } from '../../http'

import type {
  UpdateProvider,
  ResolvedUpdate,
  UnresolvedUpdate,
  ProgressCallback,
  NoUpdate,
} from '../types'

import { getOrDownloadManifest, getReleaseSet } from './release-manifest'
import { cleanUpAndGetOrDownloadReleaseFiles } from './release-files'
import { latestVersionForChannel, shouldUpdate } from './latest-update'

import type { DownloadProgress } from '../../http'

const log = createLogger('systemUpdate/from-web/provider')

export interface WebUpdateSource {
  manifestUrl: string
  channel: string
  updateCacheDirectory: string
  currentVersion: string
}

export function getProvider(
  from: WebUpdateSource
): UpdateProvider<WebUpdateSource> {
  let locked = false
  let canceller = new AbortController()
  const lockCache = () => {
    locked = true
    canceller.abort('cache locked')
    canceller = new AbortController()
  }
  const versionCacheDir = path.join(from.updateCacheDirectory, 'versions')
  const noUpdate = {
    version: null,
    files: null,
    downloadProgress: 0,
  } as const
  let currentUpdate: UnresolvedUpdate = noUpdate
  let currentCheck: Promise<ResolvedUpdate> | null = null
  const updater = async (progress: ProgressCallback) => {
    const myCanceller = canceller
    const previousUpdate = {
      version: currentUpdate.version,
      files: currentUpdate?.files == null ? null : { ...currentUpdate.files },
      downloadProgress: currentUpdate.downloadProgress,
    } as ResolvedUpdate
    if (locked) {
      throw new Error('cache locked')
    }
    const returnNoUpdate = (): NoUpdate => {
      currentUpdate = noUpdate
      progress(noUpdate)
      return noUpdate
    }
    const manifest = await getOrDownloadManifest(
      from.manifestUrl,
      from.updateCacheDirectory,
      myCanceller
    ).catch((error: Error) => {
      if (myCanceller.signal.aborted) {
        log.info('aborted cache update because cache was locked')
        currentUpdate = previousUpdate
        progress(previousUpdate)
        throw error
      }
      log.info(
        `Failed to get or download update manifest: ${error.name}: ${error.message}`
      )
      return null
    })
    if (manifest == null) {
      log.info(`no manifest found, returning`)
      return returnNoUpdate()
    }
    const latestVersion = latestVersionForChannel(
      Object.keys(manifest.production),
      from.channel
    )

    const versionToUpdate = shouldUpdate(from.currentVersion, latestVersion)
    if (versionToUpdate == null) {
      log.debug(`no update found, returning`)
      return returnNoUpdate()
    }
    const releaseUrls = getReleaseSet(manifest, versionToUpdate)
    if (releaseUrls == null) {
      log.debug(`no release urls found, returning`)
      return returnNoUpdate()
    }
    progress({ version: latestVersion, files: null, downloadProgress: 0 })
    if (myCanceller.signal.aborted) {
      log.info('aborted cache update because cache was locked')
      currentUpdate = previousUpdate
      progress(previousUpdate)
      throw new LocalAbortError('cache locked')
    }
    const localFiles = await cleanUpAndGetOrDownloadReleaseFiles(
      releaseUrls,
      versionCacheDir,
      versionToUpdate,
      (downloadProgress: DownloadProgress): void => {
        const update = {
          version: versionToUpdate,
          files: null,
          downloadProgress:
            downloadProgress.size == null || downloadProgress.size === 0.0
              ? 0
              : (downloadProgress.downloaded / downloadProgress.size) * 100,
        }
        currentUpdate = update
        progress(update)
      },
      myCanceller
    ).catch((err: Error) => {
      if (myCanceller.signal.aborted) {
        currentUpdate = previousUpdate
        progress(previousUpdate)
        throw err
      } else {
        log.warning(`Failed to fetch update data: ${err.name}: ${err.message}`)
      }
      return null
    })
    if (localFiles == null) {
      return returnNoUpdate()
    }
    if (myCanceller.signal.aborted) {
      currentUpdate = previousUpdate
      progress(previousUpdate)
      throw new LocalAbortError('cache locked')
    }
    const updateDetails = {
      version: versionToUpdate,
      files: localFiles,
      downloadProgress: 100,
    } as const
    currentUpdate = updateDetails
    progress(updateDetails)
    return updateDetails
  }
  return {
    getUpdateDetails: () => currentUpdate,
    refreshUpdateCache: (progress: ProgressCallback) => {
      if (currentCheck != null) {
        return new Promise((_, reject) =>
          reject(new Error('Check already ongoing'))
        )
      } else {
        const updaterPromise = updater(progress)
        currentCheck = updaterPromise
        return updaterPromise.finally(() => {
          currentCheck = null
        })
      }
    },

    teardown: () => {
      lockCache()
      return rm(from.updateCacheDirectory, { recursive: true, force: true })
    },
    lockUpdateCache: lockCache,
    unlockUpdateCache: () => {
      locked = false
    },
  }
}
