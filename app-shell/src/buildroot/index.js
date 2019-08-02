// @flow
// buildroot update files
import path from 'path'
import { readFile, ensureDir } from 'fs-extra'
import { app } from 'electron'

import createLogger from '../log'
import { getConfig } from '../config'
import { CURRENT_VERSION } from '../update'
import { downloadManifest, getReleaseSet } from './release-manifest'
import { getReleaseFiles, readUserFileInfo } from './release-files'
import {
  getPremigrationWheels,
  startPremigration,
  uploadSystemFile,
} from './update'

import type { Action, Dispatch } from '../types'
import type { ReleaseSetFilepaths } from './types'
import type {
  BuildrootUpdateInfo,
  BuildrootAction,
} from '@opentrons/app/src/shell'

const log = createLogger(__filename)

const DIRECTORY = path.join(app.getPath('userData'), '__ot_buildroot__')

let checkingForUpdates = false
let updateSet: ReleaseSetFilepaths | null = null

export function registerBuildrootUpdate(dispatch: Dispatch) {
  const buildrootEnabled = Boolean(getConfig('devInternal')?.enableBuildRoot)
  log.debug('buildroot status', { enabled: buildrootEnabled })

  return function handleAction(action: Action) {
    if (buildrootEnabled) {
      switch (action.type) {
        case 'shell:CHECK_UPDATE':
          if (!checkingForUpdates) {
            checkingForUpdates = true
            checkForBuildrootUpdate(dispatch).then(
              () => (checkingForUpdates = false)
            )
          }
          break

        case 'buildroot:START_PREMIGRATION': {
          const robot = action.payload

          getPremigrationWheels()
            .then(wheels => {
              log.info('Starting robot premigration', { robot, wheels })
              return startPremigration(robot, wheels.api, wheels.updateServer)
            })
            .then(
              (): BuildrootAction => ({
                type: 'buildroot:PREMIGRATION_DONE',
                payload: robot.name,
              })
            )
            .catch(
              (error: Error): BuildrootAction => ({
                type: 'buildroot:PREMIGRATION_ERROR',
                payload: error.message,
              })
            )
            .then(dispatch)

          break
        }

        case 'buildroot:UPLOAD_FILE': {
          const { host, path, systemFile } = action.payload
          const file = systemFile !== null ? systemFile : updateSet?.system

          if (file == null) {
            return dispatch({
              type: 'buildroot:UNEXPECTED_ERROR',
              payload: { message: 'Buildroot update file not downloaded' },
            })
          }

          uploadSystemFile(host, path, file)
            .then(() => ({
              type: 'buildroot:FILE_UPLOAD_DONE',
              payload: host.name,
            }))
            .catch((error: Error) => {
              log.warn('Error uploading update to robot', { path, file, error })

              return {
                type: 'buildroot:UNEXPECTED_ERROR',
                payload: {
                  message: `Error uploading update to robot: ${error.message}`,
                },
              }
            })
            .then(dispatch)

          break
        }

        case 'buildroot:READ_USER_FILE': {
          const { systemFile } = action.payload

          readUserFileInfo(systemFile)
            .then(userFile => ({
              type: 'buildroot:USER_FILE_INFO',
              payload: {
                systemFile: userFile.systemFile,
                version: userFile.versionInfo.opentrons_api_version,
              },
            }))
            .catch((error: Error) => ({
              type: 'buildroot:UNEXPECTED_ERROR',
              payload: { message: error.message },
            }))
            .then(dispatch)

          break
        }
      }
    }
  }
}

// check for a buildroot update matching the current app version
//   1. Ensure the buildroot directory exists
//   2. Download the manifest file from S3
//   3. Get the release files according to the manifest
//      a. If the files need downloading, dispatch progress updates to UI
//   4. Cache the filepaths of the update files in memory
//   5. Dispatch info or error to UI
export function checkForBuildrootUpdate(dispatch: Dispatch): Promise<mixed> {
  const manifestUrl = getConfig('buildroot').manifestUrl
  const fileDownloadDir = path.join(DIRECTORY, CURRENT_VERSION)

  return ensureDir(fileDownloadDir)
    .then(() => downloadManifest(manifestUrl))
    .then(manifest => {
      const urls = getReleaseSet(manifest, CURRENT_VERSION)
      let prevPercentDone = 0

      if (!urls) {
        log.warn('No release files in manifest', {
          version: CURRENT_VERSION,
          manifest,
        })

        throw new Error(`No update files found for version ${CURRENT_VERSION}`)
      }

      const handleProgress = progress => {
        const { downloaded, size } = progress
        if (size !== null) {
          const percentDone = Math.round((downloaded / size) * 100)

          if (Math.abs(percentDone - prevPercentDone) > 0) {
            dispatch({
              type: 'buildroot:DOWNLOAD_PROGRESS',
              payload: percentDone,
            })
            prevPercentDone = percentDone
          }
        }
      }

      return getReleaseFiles(urls, fileDownloadDir, handleProgress)
    })
    .then(filepaths => cacheUpdateSet(filepaths))
    .then(updateInfo =>
      dispatch({ type: 'buildroot:UPDATE_INFO', payload: updateInfo })
    )
    .catch(error =>
      dispatch({ type: 'buildroot:DOWNLOAD_ERROR', payload: error.message })
    )
}

function cacheUpdateSet(
  filepaths: ReleaseSetFilepaths
): Promise<BuildrootUpdateInfo> {
  updateSet = filepaths

  return readFile(updateSet.releaseNotes, 'utf8').then(releaseNotes => ({
    version: CURRENT_VERSION,
    releaseNotes,
  }))
}
