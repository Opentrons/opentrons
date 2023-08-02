// robot update files
import path from 'path'
import { readFile, ensureDir } from 'fs-extra'

import { UI_INITIALIZED } from '@opentrons/app/src/redux/shell/actions'
import { createLogger } from '../log'

import { downloadManifest, getReleaseSet } from './release-manifest'
import { UPDATE_MANIFEST_URLS, CACHE_DIR_FOR_MACHINE, CACHE_DIR_FOR_MACHINE_FILES, CURRENT_VERSION } from './constants'
import {
  getReleaseFiles,
  readUserFileInfo,
  cleanupReleaseFiles,
} from './release-files'
import { startPremigration, uploadSystemFile } from './update'

import type { DownloadProgress } from '../http'
import type { Action, Dispatch } from '../types'
import type {
  ReleaseSetUrls,
  ReleaseSetFilepaths,
} from './types'
import type {
  RobotUpdateInfo,
  RobotUpdateAction,
  RobotUpdateTarget
} from '@opentrons/app/src/redux/robot-update/types'
import type { RobotHost } from '@opentrons/app/src/redux/robot-api/types'

const log = createLogger('robot-update/index')

let checkingForUpdates = false
let updateSet: Record<RobotUpdateTarget, ReleaseSetFilepaths | null> = { ot2: null, flex: null }

export function registerRobotUpdate(dispatch: Dispatch): Dispatch {
  return function handleAction(action: Action) {
    switch (action.type) {
      case UI_INITIALIZED:
      case 'shell:CHECK_UPDATE':
        if (!checkingForUpdates) {
          checkingForUpdates = true
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          checkForRobotUpdate(dispatch).then(() => (checkingForUpdates = false))
        }
        break

      case 'robotUpdate:START_PREMIGRATION': {
        const robot = action.payload as RobotHost

        log.info('Starting robot premigration', { robot })

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        startPremigration(robot)
          .then(
            (): RobotUpdateAction => ({
              type: 'robotUpdate:PREMIGRATION_DONE',
              payload: robot.name,
            })
          )
          .catch(
            (error: Error): RobotUpdateAction => ({
              type: 'robotUpdate:PREMIGRATION_ERROR',
              payload: { message: error.message },
            })
          )
          .then(dispatch)

        break
      }

      case 'robotUpdate:UPLOAD_FILE': {
        const { host, path, systemFile, robotType } = action.payload
        const file = systemFile !== null ? systemFile : updateSet[robotType]?.system

        if (file == null) {
          return dispatch({
            type: 'robotUpdate:UNEXPECTED_ERROR',
            payload: { message: 'Robot update file not downloaded' },
          })
        }

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        uploadSystemFile(host, path, file)
          .then(() => ({
            type: 'robotUpdate:FILE_UPLOAD_DONE' as const,
            payload: host.name,
          }))
          .catch((error: Error) => {
            log.warn('Error uploading update to robot', { path, file, error })

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
        readUserFileInfo(systemFile)
          .then(userFile => ({
            type: 'robotUpdate:USER_FILE_INFO' as const,
            payload: {
              systemFile: userFile.systemFile,
              version: userFile.versionInfo.opentrons_api_version,
            },
          }))
          .catch((error: Error) => ({
            type: 'robotUpdate:UNEXPECTED_ERROR' as const,
            payload: { message: error.message },
          }))
          .then(dispatch)

        break
      }
    }
  }
}

export function getRobotSystemUpdateUrls(
  robot: RobotUpdateTarget
): Promise<ReleaseSetUrls | null> {
  const manifestUrls = UPDATE_MANIFEST_URLS()

  return downloadManifest(manifestUrls[robot], path.join(CACHE_DIR_FOR_MACHINE(robot), 'releases.json'))
    .then(manifest => {
      const urls = getReleaseSet(manifest, CURRENT_VERSION)

      if (urls === null) {
        log.warn('No release files in manifest', {
          version: CURRENT_VERSION,
          manifest,
        })
      }

      return urls
    })
    .catch((error: Error) => {
      log.warn('Error retrieving release manifest', {
        version: CURRENT_VERSION,
        error,
      })

      return null
    })
}

// check for a robot update matching the current app version
//   1. Ensure the robot update directory exists
//   2. Download the manifest file from S3
//   3. Get the release files according to the manifest
//      a. If the files need downloading, dispatch progress updates to UI
//   4. Cache the filepaths of the update files in memory
//   5. Dispatch info or error to UI
export function checkForRobotUpdate(
  dispatch: Dispatch
): Promise<[unknown, unknown]> {

  const fetchFilesFromManifest = (urls: ReleaseSetUrls, target: RobotUpdateTarget): Promise<unknown> => {
    dispatch({ type: 'robotUpdate:UPDATE_VERSION', payload: CURRENT_VERSION })
    let prevPercentDone = 0
    const handleProgress = (progress: DownloadProgress): void => {
      const { downloaded, size } = progress
      if (size !== null) {
        const percentDone =
          Math.round(downloaded / size) * 100
        if ((percentDone - prevPercentDone) > 0) {
          dispatch({
            type: 'robotUpdate:DOWNLOAD_PROGRESS',
            payload: {progress: percentDone, target: target}
          })
        }
        prevPercentDone = percentDone
      }
    }

    const targetDownloadDir = CACHE_DIR_FOR_MACHINE_FILES(target)

    return ensureDir(targetDownloadDir).then(
      () => getReleaseFiles(urls, targetDownloadDir, handleProgress))
      .then(filepaths => cacheUpdateSet(filepaths, target))
      .then(updateInfo =>
        dispatch({ type: 'robotUpdate:UPDATE_INFO', payload: updateInfo })
      )
      .catch((error: Error) =>
        dispatch({ type: 'robotUpdate:DOWNLOAD_ERROR', payload: {error: error.message, target: target}})
      )
      .then(() => cleanupReleaseFiles(DIRECTORY, CURRENT_VERSION))
  }

  return Promise.all([
      getRobotSystemUpdateUrls('ot2').then(urls =>
        urls === null ? Promise.resolve() : fetchFilesFromManifest(urls, 'ot2')
      ),
      getRobotSystemUpdateUrls('flex').then(urls =>
        urls === null ? Promise.resolve() : fetchFilesFromManifest(urls, 'flex')
      ),
    ]).catch((error: Error) => {
      log.warn('Failure during release file download', { error })
    }).then()
}

function cacheUpdateSet(
  filepaths: ReleaseSetFilepaths,
  target: RobotUpdateTarget
): Promise<RobotUpdateInfo> {
  updateSet[target] = filepaths

  return readFile(filepaths.releaseNotes, 'utf8').then(releaseNotes => ({
    version: CURRENT_VERSION,
    releaseNotes,
    target
  }))
}
