import { rm } from 'fs/promises'
import path from 'path'
import cloneDeep from 'lodash/cloneDeep'

import { LocalAbortError } from '../../http'
import { createLogger } from '../../log'
import { latestVersionForChannel, shouldUpdate } from './latest-update'
import {
  cleanUpAndDownloadReleaseFiles,
  downloadReleaseNotes,
  ensureCleanReleaseCacheForVersion,
  getReleaseFilesIfExist,
  removeTemporaryDownloads,
} from './release-files'
import { getOrDownloadManifest, getReleaseSet } from './release-manifest'

import type { DownloadProgress } from '../../http'
import type {
  FoundUpdate,
  NoUpdate,
  ProgressCallback,
  ReleaseSetUrls,
  ResolvedUpdate,
  UnresolvedUpdate,
  UpdateProvider,
} from '../types'

const log = createLogger('systemUpdate/from-web/provider')

interface UpdateDetailsResolved {
  update: ResolvedUpdate
  urls: null
}
interface UpdateDetailsFound {
  update: FoundUpdate
  urls: ReleaseSetUrls
}

type UpdateDetails = UpdateDetailsResolved | UpdateDetailsFound

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
    update: {
      version: null,
      files: { system: null, releaseNotes: null },
      releaseNotes: null,
      downloadProgress: 0,
    },
    urls: null,
  } as const
  let currentUpdate: UpdateDetails = noUpdate
  let currentCheck: Promise<ResolvedUpdate> | Promise<UnresolvedUpdate> | null =
    null
  const updater = async (
    progress: ProgressCallback
  ): Promise<ResolvedUpdate> => {
    const myCanceller = canceller
    if (locked) {
      throw new Error('cache locked')
    }

    const returnNoUpdate = (): NoUpdate => {
      currentUpdate = noUpdate
      progress(noUpdate.update)
      return noUpdate.update
    }

    // We don't have an update ready to download, or we already downloaded it
    if (currentUpdate.urls === null) {
      progress(currentUpdate.update)
      return currentUpdate.update
    }
    const previousUpdate = cloneDeep(currentUpdate)

    const downloadingUpdate = {
      version: previousUpdate.update.version,
      files: { system: null, releaseNotes: previousUpdate.update.releaseNotes },
      releaseNotes: previousUpdate.update.releaseNotes,
      downloadProgress: 0,
    }
    progress(downloadingUpdate)
    currentUpdate.update = downloadingUpdate

    if (myCanceller.signal.aborted) {
      log.info('aborted cache update because cache was locked')
      currentUpdate = previousUpdate
      progress(currentUpdate.update)
      throw new LocalAbortError('cache locked')
    }
    const localFiles = await cleanUpAndDownloadReleaseFiles(
      previousUpdate.urls,
      versionCacheDir,
      previousUpdate.update.version,
      (downloadProgress: DownloadProgress): void => {
        const downloadProgressPercent =
          downloadProgress.size == null || downloadProgress.size === 0.0
            ? 0
            : (downloadProgress.downloaded / downloadProgress.size) * 100
        log.debug(
          `Downloading update ${previousUpdate.update.version}: ${downloadProgress.downloaded}/${downloadProgress.size}B (${downloadProgressPercent}%)`
        )
        const update = {
          version: previousUpdate.update.version,
          files: {
            system: null,
            releaseNotes: previousUpdate.update.files.releaseNotes,
          },
          releaseNotes: previousUpdate.update.releaseNotes,
          downloadProgress: downloadProgressPercent,
        }
        currentUpdate.update = update
        progress(update)
      },
      myCanceller
    ).catch((err: Error) => {
      if (myCanceller.signal.aborted) {
        currentUpdate = previousUpdate
        progress(currentUpdate.update)
        throw err
      } else {
        log.warn(`Failed to fetch update data: ${err.name}: ${err.message}`)
      }
      return null
    })

    if (localFiles == null) {
      log.info(`Download of ${currentUpdate.update.version} failed`)
      return returnNoUpdate()
    }
    if (myCanceller.signal.aborted) {
      currentUpdate = previousUpdate
      progress(currentUpdate.update)
      throw new LocalAbortError('cache locked')
    }

    const updateDetails = {
      version: currentUpdate.update.version,
      files: {
        system: localFiles.system,
        releaseNotes: localFiles.releaseNotes,
      },
      releaseNotes: localFiles.releaseNotesContent,
      downloadProgress: 100,
    } as const
    currentUpdate = { update: updateDetails, urls: null }
    progress(updateDetails)
    return updateDetails
  }
  const updateChecker = async (
    progress: ProgressCallback
  ): Promise<UnresolvedUpdate> => {
    const previousUpdate = cloneDeep(currentUpdate)
    if (locked) {
      throw new Error('cache locked')
    }
    const returnNoUpdate = (): NoUpdate => {
      currentUpdate = noUpdate
      progress(noUpdate.update)
      return noUpdate.update
    }
    const myCanceller = canceller
    const manifest = await getOrDownloadManifest(
      from.manifestUrl,
      from.updateCacheDirectory,
      myCanceller
    ).catch((error: Error) => {
      if (myCanceller.signal.aborted) {
        log.info('aborted cache update because cache was locked')
        currentUpdate = previousUpdate
        progress(previousUpdate.update)
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
      Object.keys(manifest.productionV2 ?? {}),
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
    if (versionToUpdate === previousUpdate.update.version) {
      currentUpdate = previousUpdate
      progress(currentUpdate.update)
      return currentUpdate.update
    }
    log.info(`Checking if version ${latestVersion} is downloaded`)
    const maybeDownloaded = await getReleaseFilesIfExist(
      releaseUrls,
      versionCacheDir,
      versionToUpdate
    )
    if (maybeDownloaded != null) {
      currentUpdate = {
        update: {
          version: versionToUpdate,
          files: {
            system: maybeDownloaded.system,
            releaseNotes: maybeDownloaded.releaseNotes,
          },
          releaseNotes: maybeDownloaded.releaseNotesContent,
          downloadProgress: 100,
        },
        urls: null,
      }
      progress(currentUpdate.update)
      return currentUpdate.update
    }
    const releaseDir = await ensureCleanReleaseCacheForVersion(
      versionCacheDir,
      versionToUpdate
    )
    if (myCanceller.signal.aborted) {
      currentUpdate = previousUpdate
      progress(previousUpdate.update)
      throw new LocalAbortError('cache locked')
    }
    const releaseNotesFiles = await downloadReleaseNotes(
      releaseUrls.releaseNotes ?? null,
      releaseDir,
      myCanceller
    ).catch((err: Error) => {
      currentUpdate = previousUpdate
      progress(previousUpdate.update)
      throw err
    })
    currentUpdate = {
      update: {
        version: versionToUpdate,
        files: {
          system: null,
          releaseNotes: releaseNotesFiles.releaseNotes ?? null,
        },
        releaseNotes: releaseNotesFiles.releaseNotesContent ?? null,
        downloadProgress: 0,
      },
      urls: releaseUrls,
    }
    progress(currentUpdate.update)
    return currentUpdate.update
  }
  return {
    getUpdateDetails: () => currentUpdate.update,
    scanUpdate: (progress: ProgressCallback) => {
      if (currentCheck != null) {
        return Promise.reject(new Error('ongoing'))
      } else {
        const checkerPromise = updateChecker(progress)
        currentCheck = checkerPromise
        return checkerPromise.finally(() => {
          currentCheck = null
        })
      }
    },
    downloadUpdate: (progress: ProgressCallback) => {
      if (currentCheck != null) {
        return Promise.reject(new Error('ongoing'))
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
      log.warn('tearing down and removing cache dir because teardown()')
      return rm(from.updateCacheDirectory, { recursive: true, force: true })
    },
    lockUpdateCache: lockCache,
    unlockUpdateCache: () => {
      locked = false
    },
    name: () =>
      `WebUpdateProvider from ${from.manifestUrl} channel ${from.channel}`,
    source: () => from,
    cleanup: () =>
      removeTemporaryDownloads(
        path.join(from.updateCacheDirectory, 'versions')
      ),
    ongoingCheck: () => currentCheck,
  }
}
