import { rm, writeFile } from 'fs/promises'
import path from 'path'
import tempy from 'tempy'

import { createLogger } from '../../log'
import { getLatestMassStorageUpdateFile } from './scan-device'

import type { ProgressCallback, ResolvedUpdate, UpdateProvider } from '../types'

export interface USBUpdateSource {
  currentVersion: string
  massStorageDeviceRoot: string
  massStorageDeviceFiles: string[]
}

const fakeReleaseNotesForMassStorage = (version: string): string => `
# Opentrons Robot Software Version ${version}

This update is from a USB mass storage device connected to your Flex, and release notes cannot be shown.

Don't remove the USB mass storage device while the update is in progress.
`
const log = createLogger('system-updates/from-usb')

export function getProvider(
  from: USBUpdateSource
): UpdateProvider<USBUpdateSource> {
  const noUpdate = {
    version: null,
    files: { system: null, releaseNotes: null },
    releaseNotes: null,
    downloadProgress: 0,
  } as const
  let currentUpdate: ResolvedUpdate = noUpdate
  let canceller = new AbortController()
  let currentCheck: Promise<ResolvedUpdate> | null = null
  const tempdir = tempy.directory()
  let tornDown = false

  const checkUpdates = async (
    progress: ProgressCallback
  ): Promise<ResolvedUpdate> => {
    const myCanceller = canceller
    if (myCanceller.signal.aborted || tornDown) {
      progress(noUpdate)
      throw new Error('cache torn down')
    }
    const updateFile = await getLatestMassStorageUpdateFile(
      from.massStorageDeviceFiles
    ).catch(() => null)
    if (myCanceller.signal.aborted) {
      progress(noUpdate)
      throw new Error('cache torn down')
    }
    if (updateFile == null) {
      log.info(`No update file in presented files`)
      progress(noUpdate)
      currentUpdate = noUpdate
      return noUpdate
    }
    log.info(`Update file found for version ${updateFile.version}`)
    if (updateFile.version === from.currentVersion) {
      progress(noUpdate)
      currentUpdate = noUpdate
      return noUpdate
    }
    await writeFile(
      path.join(tempdir, 'dummy-release-notes.md'),
      fakeReleaseNotesForMassStorage(updateFile.version)
    )
    if (myCanceller.signal.aborted) {
      progress(noUpdate)
      throw new Error('cache torn down')
    }
    const update = {
      version: updateFile.version,
      files: {
        system: updateFile.path,
        releaseNotes: path.join(tempdir, 'dummy-release-notes.md'),
      },
      releaseNotes: fakeReleaseNotesForMassStorage(updateFile.version),
      downloadProgress: 100,
    } as const
    currentUpdate = update
    progress(update)
    return update
  }
  return {
    // for usb, download and scan do the same thing since we don't move
    // the update from usb to local storage
    downloadUpdate: progressCallback => {
      if (currentCheck != null) {
        return new Promise((resolve, reject) => {
          reject(new Error('Check already ongoing'))
        })
      }
      const updatePromise = checkUpdates(progressCallback)
      currentCheck = updatePromise
      return updatePromise.finally(() => {
        currentCheck = null
      })
    },
    scanUpdate: progressCallback => {
      if (currentCheck != null) {
        return new Promise((resolve, reject) => {
          reject(new Error('Check already ongoing'))
        })
      }
      const updatePromise = checkUpdates(progressCallback)
      currentCheck = updatePromise
      return updatePromise.finally(() => {
        currentCheck = null
      })
    },
    getUpdateDetails: () => currentUpdate,
    lockUpdateCache: () => {},
    unlockUpdateCache: () => {},
    teardown: () => {
      canceller.abort()
      tornDown = true
      canceller = new AbortController()
      return rm(tempdir, { recursive: true, force: true })
    },
    name: () => `USBUpdateProvider from ${from.massStorageDeviceRoot}`,
    source: () => from,
    cleanup: () => Promise.resolve(),
    ongoingCheck: () => currentCheck,
  }
}
