// buildroot update files
import path from 'path'
import { ensureDir } from 'fs-extra'
import { app } from 'electron'

import { UI_INITIALIZED } from '@opentrons/app/src/redux/shell/actions'
import { createLogger } from '../log'
import { getConfig } from '../config'
import { getLatestVersion, updateLatestVersion } from '../update'
import { downloadManifest, getReleaseSet } from './release-manifest'
import {
  getReleaseFiles,
  readUserFileInfo,
  cleanupReleaseFiles,
} from './release-files'
import { uploadSystemFile } from './update'

import type { DownloadProgress } from '../http'
import type { Action, Dispatch } from '../types'
import type { ReleaseSetUrls, ReleaseSetFilepaths } from './types'

const log = createLogger('buildroot/index')

const DIRECTORY = path.join(app.getPath('sessionData'), '__ot_system_update__')
const MANIFEST_CACHE = path.join(DIRECTORY, 'releases.json')

let checkingForUpdates = false
let updateSet: ReleaseSetFilepaths | null = null

export function registerRobotSystemUpdate(dispatch: Dispatch): Dispatch {
  return function handleAction(action: Action) {
    switch (action.type) {
      case UI_INITIALIZED:
      case 'shell:CHECK_UPDATE':
        if (!checkingForUpdates) {
          updateLatestVersion()
            .then(() => {
              checkingForUpdates = true
              // eslint-disable-next-line @typescript-eslint/no-floating-promises
              checkForSystemUpdate(dispatch).then(() => {
                checkingForUpdates = false
              })
            })
            .catch((error: Error) => {
              log.warn('Error checking for update', {
                error,
              })
            })
        }
        break

      case 'buildroot:UPLOAD_FILE': {
        const { host, path, systemFile } = action.payload
        const file = systemFile !== null ? systemFile : updateSet?.system
        if (file == null) {
          return dispatch({
            type: 'buildroot:UNEXPECTED_ERROR',
            payload: { message: 'Buildroot update file not downloaded' },
          })
        }

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        uploadSystemFile(host, path, file)
          .then(() => ({
            type: 'buildroot:FILE_UPLOAD_DONE' as const,
            payload: host.name,
          }))
          .catch((error: Error) => {
            log.warn('Error uploading update to robot', { path, file, error })

            return {
              type: 'buildroot:UNEXPECTED_ERROR' as const,
              payload: {
                message: `Error uploading update to robot: ${error.message}`,
              },
            }
          })
          .then(dispatch)

        break
      }

      case 'buildroot:READ_USER_FILE': {
        const { systemFile } = action.payload as { systemFile: string }

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        readUserFileInfo(systemFile)
          .then(userFile => ({
            type: 'buildroot:USER_FILE_INFO' as const,
            payload: {
              systemFile: userFile.systemFile,
              version: userFile.versionInfo.opentrons_api_version,
            },
          }))
          .catch((error: Error) => ({
            type: 'buildroot:UNEXPECTED_ERROR' as const,
            payload: { message: error.message },
          }))
          .then(dispatch)

        break
      }
    }
  }
}

export function getSystemUpdateUrls(): Promise<ReleaseSetUrls | null> {
  const manifestUrl: string = getConfig('robotSystemUpdate').manifestUrls.OT3

  return downloadManifest(manifestUrl, MANIFEST_CACHE)
    .then(manifest => {
      const urls = getReleaseSet(manifest, getLatestVersion())

      if (urls === null) {
        log.warn('No release files in manifest', {
          version: getLatestVersion(),
          manifest,
        })
      }

      return urls
    })
    .catch((error: Error) => {
      log.warn('Error retrieving release manifest', {
        version: getLatestVersion(),
        error,
      })

      return null
    })
}

// check for a system update matching the current app version
//   1. Ensure the system update directory exists
//   2. Download the manifest file from S3
//   3. Get the release files according to the manifest
//      a. If the files need downloading, dispatch progress updates to UI
//   4. Cache the filepaths of the update files in memory
//   5. Dispatch info or error to UI
export function checkForSystemUpdate(dispatch: Dispatch): Promise<unknown> {
  const fileDownloadDir = path.join(DIRECTORY, getLatestVersion())

  return ensureDir(fileDownloadDir)
    .then(getSystemUpdateUrls)
    .then(urls => {
      if (urls === null) return Promise.resolve()

      let prevPercentDone = 0

      const handleProgress = (progress: DownloadProgress): void => {
        const { downloaded, size } = progress
        if (size !== null) {
          const percentDone = Math.round((downloaded / size) * 100)
          if (Math.abs(percentDone - prevPercentDone) > 0) {
            dispatch({
              // TODO: change this action type to 'systemUpdate:DOWNLOAD_PROGRESS'
              type: 'buildroot:DOWNLOAD_PROGRESS',
              payload: percentDone,
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
          dispatch({ type: 'buildroot:UPDATE_INFO', payload: { releaseNotes } })
          dispatch({ type: 'buildroot:UPDATE_VERSION', payload: version })
        })
        .catch((error: Error) => {
          return dispatch({
            type: 'buildroot:DOWNLOAD_ERROR',
            payload: error.message,
          })
        })
        .then(() => cleanupReleaseFiles(DIRECTORY, getLatestVersion()))
        .catch((error: Error) => {
          log.warn('Unable to cleanup old release files', { error })
        })
    })
}

function cacheUpdateSet(
  filepaths: ReleaseSetFilepaths
): Promise<{ version: string; releaseNotes: string }> {
  updateSet = filepaths
  return Promise.resolve({
    releaseNotes: 'Todo: update manifest to have release notes',
    version: getLatestVersion(),
  })
  // uncomment the lines below when the OT-3 manifest points to valid release notes
  // return readFile(updateSet.releaseNotes, 'utf8').then(releaseNotes => ({
  //   version: getLatestVersion(),
  //   releaseNotes,
  // }))
}
