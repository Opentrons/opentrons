// system update files
import assert from 'assert'
import path from 'path'
import { readFile } from 'fs/promises'
import { promisify } from 'util'

import { ensureDir } from 'fs-extra'
import StreamZip from 'node-stream-zip'
import getStream from 'get-stream'

import { UI_INITIALIZED } from '../constants'
import { createLogger } from '../log'
import { postFile } from '../http'
import { getSystemUpdateDir } from './directories'
import { SYSTEM_FILENAME, VERSION_FILENAME } from './constants'

import type { DownloadProgress } from '../http'
import type { Action, Dispatch } from '../types'
import type { UserFileInfo, ReleaseSetFilepaths } from './types'

const PKG_VERSION = _PKG_VERSION_
let LATEST_OT_SYSTEM_VERSION = PKG_VERSION

const log = createLogger('systemUpdate/index')

let isGettingLatestSystemFiles = false
const isGettingMassStorageUpdatesFrom = new Set<string>()
let massStorageUpdateSet: ReleaseSetFilepaths | null = null
let systemUpdateSet: ReleaseSetFilepaths | null = null
/*
const readFileInfoAndDispatch = (
  dispatch: Dispatch,
  fileName: string,
  isManualFile: boolean = false
): Promise<unknown> =>
  readUserFileInfo(fileName)
    .then(fileInfo => ({
      type: 'robotUpdate:FILE_INFO' as const,
      payload: {
        systemFile: fileInfo.systemFile,
        version: fileInfo.versionInfo.opentrons_api_version,
        isManualFile,
      },
    }))
    .catch((error: Error) => ({
      type: 'robotUpdate:UNEXPECTED_ERROR' as const,
      payload: { message: error.message },
    }))
    .then(dispatch)
*/
export function registerRobotSystemUpdate(dispatch: Dispatch): Dispatch {
  log.info(`Running robot system updates storing to ${getSystemUpdateDir()}`)
  return function handleAction(action: Action) {
    switch (action.type) {
      case UI_INITIALIZED:
      case 'shell:CHECK_UPDATE':
        break

      case 'robotUpdate:UPLOAD_FILE': {
        const { host, path, systemFile } = action.payload
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        postFile(
          `http://${host.ip}:${host.port}${path}`,
          SYSTEM_FILENAME,
          systemFile
        )
          .then(() => ({
            type: 'robotUpdate:FILE_UPLOAD_DONE' as const,
            payload: host.name,
          }))
          .catch((error: Error) => {
            log.warn('Error uploading update to robot', {
              path,
              systemFile,
              error,
            })

            return {
              type: 'robotUpdate:UNEXPECTED_ERROR' as const,
              payload: {
                message: `Error uploading update to robot: ${error.message}`,
              },
            }
          })
          .then(dispatch)

        break
      }

      case 'robotUpdate:READ_USER_FILE': {
        const { systemFile } = action.payload as { systemFile: string }
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        //readFileInfoAndDispatch(dispatch, systemFile, true)
        break
      }
      case 'robotUpdate:READ_SYSTEM_FILE': {
        const systemFile =
          massStorageUpdateSet?.system ?? systemUpdateSet?.system
        if (systemFile == null) {
          dispatch({
            type: 'robotUpdate:UNEXPECTED_ERROR',
            payload: { message: 'System update file not downloaded' },
          })
          return
        }
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        //readFileInfoAndDispatch(dispatch, systemFile)
        break
      }
      case 'shell:ROBOT_MASS_STORAGE_DEVICE_ENUMERATED':
        if (isGettingMassStorageUpdatesFrom.has(action.payload.rootPath)) {
          return
        }
        isGettingMassStorageUpdatesFrom.add(action.payload.rootPath)
        getLatestMassStorageUpdateFiles(action.payload.filePaths, dispatch)
          .then(() => {
            isGettingMassStorageUpdatesFrom.delete(action.payload.rootPath)
          })
          .catch(() => {
            isGettingMassStorageUpdatesFrom.delete(action.payload.rootPath)
          })
        break
      case 'shell:ROBOT_MASS_STORAGE_DEVICE_REMOVED':
        if (
          massStorageUpdateSet !== null &&
          massStorageUpdateSet.system.startsWith(action.payload.rootPath)
        ) {
          console.log(
            `Mass storage device ${action.payload.rootPath} removed, reverting to non-usb updates`
          )
          massStorageUpdateSet = null
          getCachedSystemUpdateFiles(dispatch)
        } else {
          console.log(
            `Mass storage device ${action.payload.rootPath} removed but this was not an update source`
          )
        }
        break
    }
  }
}

const dispatchUpdateInfo = (
  info: { version: string | null; releaseNotes: string | null; force: boolean },
  dispatch: Dispatch
): void => {
  const { version, releaseNotes, force } = info
  dispatch({
    type: 'robotUpdate:UPDATE_INFO',
    payload: { releaseNotes, version, force, target: 'flex' },
  })
  dispatch({
    type: 'robotUpdate:UPDATE_VERSION',
    payload: { version, force, target: 'flex' },
  })
}

// Get latest system update version
//   1. Ensure the system update directory exists
//   2. Get the manifest file from the local cache
//   3. Get the release files according to the manifest
//      a. If the files need downloading, dispatch progress updates to UI
//   4. Cache the filepaths of the update files in memory
//   5. Dispatch info or error to UI
export function getLatestSystemUpdateFiles(
  dispatch: Dispatch
): Promise<unknown> {
  const fileDownloadDir = path.join(
    getSystemUpdateDir(),
    'robot-system-updates'
  )

  return (
    ensureDir(getSystemUpdateDir())
      /*.then(() => getLatestSystemUpdateUrls())*/
      .then(
        /*urls*/ () => {
          /*if (urls === null) {
        const latestVersion = getLatestVersion()
        log.warn('No release files in manifest', {
          version: latestVersion,
        })
        return Promise.reject(
          new Error(`No release files in manifest for version ${latestVersion}`)
        )
      }*/

          let prevPercentDone = 0

          const handleProgress = (progress: DownloadProgress): void => {
            const { downloaded, size } = progress
            if (size !== null) {
              const percentDone = Math.round((downloaded / size) * 100)
              if (Math.abs(percentDone - prevPercentDone) > 0) {
                if (massStorageUpdateSet === null) {
                  dispatch({
                    // TODO: change this action type to 'systemUpdate:DOWNLOAD_PROGRESS'
                    type: 'robotUpdate:DOWNLOAD_PROGRESS',
                    payload: { progress: percentDone, target: 'flex' },
                  })
                }
                prevPercentDone = percentDone
              }
            }
          }
          /*
      return getReleaseFiles(urls, fileDownloadDir, handleProgress)
        .then(filepaths => {
          return cacheUpdateSet(filepaths)
        })
        .then(updateInfo => {
          massStorageUpdateSet === null &&
            dispatchUpdateInfo({ force: false, ...updateInfo }, dispatch)
        })
        .catch((error: Error) => {
          dispatch({
            type: 'robotUpdate:DOWNLOAD_ERROR',
            payload: { error: error.message, target: 'flex' },
          })
        })
        .then(() =>
          cleanupReleaseFiles(getSystemUpdateDir(), 'robot-system-updates')
        )
        .catch((error: Error) => {
          log.warn('Unable to cleanup old release files', { error })
        })
        */
        }
      )
  )
}

export function getCachedSystemUpdateFiles(
  dispatch: Dispatch
): Promise<unknown> {
  if (systemUpdateSet) {
    return getInfoFromUpdateSet(systemUpdateSet)
      .then(updateInfo => {
        dispatchUpdateInfo({ force: false, ...updateInfo }, dispatch)
      })
      .catch(err => {
        console.log(`Could not get info from update set: ${err}`)
      })
  } else {
    dispatchUpdateInfo(
      { version: null, releaseNotes: null, force: false },
      dispatch
    )
    return new Promise(resolve => {
      resolve('no files')
    })
  }
}

function getInfoFromUpdateSet(
  filepaths: ReleaseSetFilepaths
): Promise<{ version: string; releaseNotes: string | null }> {
  const version = '0.0.0' /*getLatestVersion()*/
  const releaseNotesContentPromise = filepaths.releaseNotes
    ? readFile(filepaths.releaseNotes, 'utf8')
    : new Promise<string | null>(resolve => {
        resolve(null)
      })
  return releaseNotesContentPromise
    .then(releaseNotes => ({
      version: version,
      releaseNotes,
    }))
    .catch(() => ({ version: version, releaseNotes: '' }))
}

function cacheUpdateSet(
  filepaths: ReleaseSetFilepaths
): Promise<{ version: string; releaseNotes: string | null }> {
  systemUpdateSet = filepaths
  return getInfoFromUpdateSet(systemUpdateSet)
}

export function readUserFileInfo(systemFile: string): Promise<UserFileInfo> {
  const openZip = new Promise<StreamZip>((resolve, reject) => {
    const zip = new StreamZip({ file: systemFile, storeEntries: true })
      .once('ready', handleReady)
      .once('error', handleError)

    function handleReady(): void {
      cleanup()
      resolve(zip)
    }

    function handleError(error: Error): void {
      cleanup()
      zip.close()
      reject(error)
    }

    function cleanup(): void {
      zip.removeListener('ready', handleReady)
      zip.removeListener('error', handleError)
    }
  })

  return openZip.then(zip => {
    const entries = zip.entries()
    const streamFromZip = promisify(zip.stream.bind(zip))

    assert(VERSION_FILENAME in entries, `${VERSION_FILENAME} not in archive`)

    const result = streamFromZip(VERSION_FILENAME)
      // @ts-expect-error(mc, 2021-02-17): stream may be undefined
      .then(getStream)
      .then(JSON.parse)
      .then(versionInfo => ({
        systemFile,
        versionInfo,
      }))

    result.finally(() => {
      zip.close()
    })

    return result
  })
}
