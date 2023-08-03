// system update files
import path from 'path'
import { ensureDir } from 'fs-extra'
import { readFile } from 'fs/promises'
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

let isGettingLatestSystemFiles = false
let updateSet: ReleaseSetFilepaths | null = null

const readFileInfoAndDispatch = (
  dispatch: Dispatch,
  fileName: string
): Promise<void> =>
  readUserFileInfo(fileName)
    .then(fileInfo => ({
      type: 'robotUpdate:FILE_INFO' as const,
      payload: {
        systemFile: fileInfo.systemFile,
        version: fileInfo.versionInfo.opentrons_api_version,
      },
    }))
    .catch((error: Error) => ({
      type: 'robotUpdate:UNEXPECTED_ERROR' as const,
      payload: { message: error.message },
    }))
    .then(dispatch)

export function registerRobotSystemUpdate(dispatch: Dispatch): Dispatch {
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
        readFileInfoAndDispatch(dispatch, systemFile)
        break
      }
      case 'robotUpdate:READ_SYSTEM_FILE': {
        const systemFile = updateSet?.system
        if (systemFile == null) {
          return dispatch({
            type: 'robotUpdate:UNEXPECTED_ERROR',
            payload: { message: 'System update file not downloaded' },
          })
        }
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        readFileInfoAndDispatch(dispatch, systemFile)
      }
    }
  }
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
  const fileDownloadDir = path.join(getSystemUpdateDir(), getLatestVersion())

  return ensureDir(fileDownloadDir)
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
            dispatch({
              // TODO: change this action type to 'systemUpdate:DOWNLOAD_PROGRESS'
              type: 'robotUpdate:DOWNLOAD_PROGRESS',
              payload: { progress: percentDone, target: 'flex' },
            })
            prevPercentDone = percentDone
          }
        }
      }

      return getReleaseFiles(urls, fileDownloadDir, handleProgress)
        .then(filepaths => {
          return cacheUpdateSet(filepaths)
        })
        .then(({ version, releaseNotes }) => {
          dispatch({
            type: 'robotUpdate:UPDATE_INFO',
            payload: { releaseNotes, version, target: 'flex' },
          })
          dispatch({
            type: 'robotUpdate:UPDATE_VERSION',
            payload: { version, target: 'flex' },
          })
        })
        .catch((error: Error) => {
          return dispatch({
            type: 'robotUpdate:DOWNLOAD_ERROR',
            payload: { error: error.message, target: 'flex' },
          })
        })
        .then(() =>
          cleanupReleaseFiles(getSystemUpdateDir(), getLatestVersion())
        )
        .catch((error: Error) => {
          log.warn('Unable to cleanup old release files', { error })
        })
    })
}

function cacheUpdateSet(
  filepaths: ReleaseSetFilepaths
): Promise<{ version: string; releaseNotes: string }> {
  updateSet = filepaths
  return readFile(updateSet.releaseNotes, 'utf8').then(releaseNotes => ({
    version: getLatestVersion(),
    releaseNotes,
  }))
}
