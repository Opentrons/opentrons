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
  const lockCache = (): void => {
    locked = true
    canceller.abort('cache locked')
    canceller = new AbortController()
  }
  const versionCacheDir = path.join(from.updateCacheDirectory, 'versions')
  const noUpdate = {
    version: null,
    files: null,
    releaseNotes: null,
    downloadProgress: 0,
  } as const
  let currentUpdate: UnresolvedUpdate = noUpdate
  let currentCheck: Promise<ResolvedUpdate> | null = null
  const updater = async (
    progress: ProgressCallback
  ): Promise<ResolvedUpdate> => {
    const myCanceller = canceller
    // this needs to be an `as`-assertion on the value because we can only guarantee that
    // currentUpdate is resolved by the function of the program: we know that this function,
    // which is the only thing that can alter currentUpdate, will always end with a resolved update,
    // and we know that this function will not be running twice at the same time.
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const previousUpdate = {
      version: currentUpdate.version,
      files: currentUpdate.files == null ? null : { ...currentUpdate.files },
      releaseNotes: currentUpdate.releaseNotes,
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
    log.info(`Finding version ${latestVersion}`)
    const downloadingUpdate = {
      version: latestVersion,
      files: null,
      releaseNotes: null,
      downloadProgress: 0,
    } as const
    progress(downloadingUpdate)
    currentUpdate = downloadingUpdate

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
        const downloadProgressPercent =
          downloadProgress.size == null || downloadProgress.size === 0.0
            ? 0
            : (downloadProgress.downloaded / downloadProgress.size) * 100
        log.debug(
          `Downloading update ${versionToUpdate}: ${downloadProgress.downloaded}/${downloadProgress.size}B (${downloadProgressPercent}%)`
        )
        const update = {
          version: versionToUpdate,
          files: null,
          releaseNotes: null,
          downloadProgress: downloadProgressPercent,
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
        log.warn(`Failed to fetch update data: ${err.name}: ${err.message}`)
      }
      return null
    })

    if (localFiles == null) {
      log.info(
        `Download of ${versionToUpdate} failed, no release data is available`
      )
      return returnNoUpdate()
    }
    if (myCanceller.signal.aborted) {
      currentUpdate = previousUpdate
      progress(previousUpdate)
      throw new LocalAbortError('cache locked')
    }

    const updateDetails = {
      version: versionToUpdate,
      files: {
        system: localFiles.system,
        releaseNotes: localFiles.releaseNotes,
      },
      releaseNotes: localFiles.releaseNotesContent,
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
        return new Promise((resolve, reject) => {
          reject(new Error('Check already ongoing'))
        })
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
    name: () =>
      `WebUpdateProvider from ${from.manifestUrl} channel ${from.channel}`,
    source: () => from,
  }
}
