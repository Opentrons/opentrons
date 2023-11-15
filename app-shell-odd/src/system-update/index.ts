// system update files
import path from 'path'
import { ensureDir } from 'fs-extra'
import { readFile } from 'fs/promises'
import StreamZip from 'node-stream-zip'
import Semver from 'semver'
import { UI_INITIALIZED } from '@opentrons/app/src/redux/shell/actions'
import { createLogger } from '../log'
import {
  getLatestSystemUpdateUrls,
  getLatestVersion,
  isUpdateAvailable,
  updateLatestVersion,
} from '../update'
import {
  getReleaseFiles,
  readUserFileInfo,
  cleanupReleaseFiles,
} from './release-files'
import { uploadSystemFile } from './update'
import { getSystemUpdateDir } from './directories'

import type { DownloadProgress } from '../http'
import type { Action, Dispatch } from '../types'
import type { ReleaseSetFilepaths } from './types'

const log = createLogger('systemUpdate/index')
const REASONABLE_VERSION_FILE_SIZE_B = 4096

let isGettingLatestSystemFiles = false
const isGettingMassStorageUpdatesFrom: Set<string> = new Set()
let massStorageUpdateSet: ReleaseSetFilepaths | null = null
let systemUpdateSet: ReleaseSetFilepaths | null = null

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

export function registerRobotSystemUpdate(dispatch: Dispatch): Dispatch {
  log.info(`Running robot system updates storing to ${getSystemUpdateDir()}`)
  return function handleAction(action: Action) {
    switch (action.type) {
      case UI_INITIALIZED:
      case 'shell:CHECK_UPDATE':
        updateLatestVersion()
          .then(() => {
            if (isUpdateAvailable() && !isGettingLatestSystemFiles) {
              isGettingLatestSystemFiles = true
              return getLatestSystemUpdateFiles(dispatch)
            }
          })
          .then(() => {
            isGettingLatestSystemFiles = false
          })
          .catch((error: Error) => {
            log.warn('Error checking for update', {
              error,
            })
            isGettingLatestSystemFiles = false
          })

        break

      case 'robotUpdate:UPLOAD_FILE': {
        const { host, path, systemFile } = action.payload
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        uploadSystemFile(host, path, systemFile)
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
        readFileInfoAndDispatch(dispatch, systemFile, true)
        break
      }
      case 'robotUpdate:READ_SYSTEM_FILE': {
        const systemFile =
          massStorageUpdateSet?.system ?? systemUpdateSet?.system
        if (systemFile == null) {
          return dispatch({
            type: 'robotUpdate:UNEXPECTED_ERROR',
            payload: { message: 'System update file not downloaded' },
          })
        }
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        readFileInfoAndDispatch(dispatch, systemFile)
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

const getVersionFromOpenedZipIfValid = (zip: StreamZip): Promise<string> =>
  new Promise((resolve, reject) =>
    Object.values(zip.entries()).forEach(entry => {
      if (
        entry.isFile &&
        entry.name === 'VERSION.json' &&
        entry.size < REASONABLE_VERSION_FILE_SIZE_B
      ) {
        const contents = zip.entryDataSync(entry.name).toString('ascii')
        try {
          const parsedContents = JSON.parse(contents)
          if (parsedContents?.robot_type !== 'OT-3 Standard') {
            reject(new Error('not a Flex release file'))
          }
          const fileVersion = parsedContents?.opentrons_api_version
          const version = Semver.valid(fileVersion)
          if (version === null) {
            reject(new Error(`${fileVersion} is not a valid version`))
          } else {
            resolve(version)
          }
        } catch (error) {
          reject(error)
        }
      }
    })
  )

interface FileDetails {
  path: string
  version: string
}

const getVersionFromZipIfValid = (path: string): Promise<FileDetails> =>
  new Promise((resolve, reject) => {
    const zip = new StreamZip({ file: path, storeEntries: true })
    zip.on('ready', () => {
      getVersionFromOpenedZipIfValid(zip)
        .then(version => {
          zip.close()
          resolve({ version, path })
        })
        .catch(err => {
          zip.close()
          reject(err)
        })
    })
    zip.on('error', err => {
      zip.close()
      reject(err)
    })
  })

const fakeReleaseNotesForMassStorage = (version: string): string => `
# Opentrons Robot Software Version ${version}

This update is from a USB mass storage device connected to your Flex, and release notes cannot be shown.

Don't remove the USB mass storage device while the update is in progress.
`

export const getLatestMassStorageUpdateFiles = (
  filePaths: string[],
  dispatch: Dispatch
): Promise<unknown> =>
  Promise.all(
    filePaths.map(path =>
      path.endsWith('.zip')
        ? getVersionFromZipIfValid(path).catch(() => null)
        : new Promise<null>(resolve => {
            resolve(null)
          })
    )
  ).then(values => {
    const update = values.reduce(
      (prev, current) =>
        prev === null
          ? current === null
            ? prev
            : current
          : current === null
          ? prev
          : Semver.gt(current.version, prev.version)
          ? current
          : prev,
      null
    )
    if (update === null) {
      console.log('no updates found in mass storage device')
    } else {
      console.log(`found update to version ${update.version} on mass storage`)
      const releaseNotes = fakeReleaseNotesForMassStorage(update.version)
      massStorageUpdateSet = { system: update.path, releaseNotes }
      dispatchUpdateInfo(
        { version: update.version, releaseNotes, force: true },
        dispatch
      )
    }
  })

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

  return ensureDir(getSystemUpdateDir())
    .then(() => getLatestSystemUpdateUrls())
    .then(urls => {
      if (urls === null) {
        const latestVersion = getLatestVersion()
        log.warn('No release files in manifest', {
          version: latestVersion,
        })
        return Promise.reject(
          new Error(`No release files in manifest for version ${latestVersion}`)
        )
      }

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

      return getReleaseFiles(urls, fileDownloadDir, handleProgress)
        .then(filepaths => {
          return cacheUpdateSet(filepaths)
        })
        .then(
          updateInfo =>
            massStorageUpdateSet === null &&
            dispatchUpdateInfo({ force: false, ...updateInfo }, dispatch)
        )
        .catch((error: Error) => {
          return dispatch({
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
    })
}

export function getCachedSystemUpdateFiles(
  dispatch: Dispatch
): Promise<unknown> {
  if (systemUpdateSet) {
    return getInfoFromUpdateSet(systemUpdateSet)
      .then(updateInfo =>
        dispatchUpdateInfo({ force: false, ...updateInfo }, dispatch)
      )
      .catch(err => console.log(`Could not get info from update set: ${err}`))
  } else {
    dispatchUpdateInfo(
      { version: null, releaseNotes: null, force: false },
      dispatch
    )
    return new Promise(resolve => resolve('no files'))
  }
}

function getInfoFromUpdateSet(
  filepaths: ReleaseSetFilepaths
): Promise<{ version: string; releaseNotes: string | null }> {
  const version = getLatestVersion()
  const releaseNotesContentPromise = filepaths.releaseNotes
    ? readFile(filepaths.releaseNotes, 'utf8')
    : new Promise<string | null>(resolve => resolve(null))
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
