// robot update files
import path from 'path'
import { ensureDir, readFile } from 'fs-extra'

import { getConfig } from '../config'
import { UI_INITIALIZED } from '../constants'
import { createLogger } from '../log'
import { CURRENT_VERSION } from '../update'
import {
  cacheDirForMachine,
  cacheDirForMachineFiles,
  getUpdateManifestUrls,
} from './constants'
import {
  cleanupReleaseFiles,
  getReleaseFiles,
  readUpdateFileInfo,
} from './release-files'
import {
  downloadManifest,
  downloadNotes,
  getReleaseSet,
} from './release-manifest'
import { startPremigration } from './update'
import { registerRobotUpdateUpload } from './upload'

import type {
  RobotUpdateAction,
  RobotUpdateInfo,
  RobotUpdateTarget,
} from '@opentrons/app/src/redux/robot-update/types'
import type { DownloadProgress } from '../http'
import type { Action, Dispatch } from '../types'
import type { ReleaseSetFilepaths, ReleaseSetUrls } from './types'

const log = createLogger('robot-update/index')

let checkingForUpdates = false
let downloadingUpdate = false
// note: this is a container whose records are reassigned and is a global cache, don't
// be fooled by the const
const updateSet: Record<RobotUpdateTarget, ReleaseSetFilepaths | null> = {
  ot2: null,
  flex: null,
}

function startRobotUpdateDownload(dispatch: Dispatch): void {
  if (downloadingUpdate) {
    return
  }
  downloadingUpdate = true
  checkingForUpdates = true
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  downloadRobotUpdate(dispatch).finally(() => {
    downloadingUpdate = false
    checkingForUpdates = false
  })
}

const readFileAndDispatchInfo = (
  dispatch: Dispatch,
  filename: string,
  isManualFile: boolean = false
): Promise<void> =>
  readUpdateFileInfo(filename)
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

export function registerRobotUpdate(dispatch: Dispatch): Dispatch {
  registerRobotUpdateUpload()

  return function handleAction(action: Action) {
    switch (action.type) {
      case UI_INITIALIZED:
      case 'shell:CHECK_UPDATE':
        if (!checkingForUpdates && !downloadingUpdate) {
          checkingForUpdates = true
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          checkForRobotUpdate(dispatch)
            .finally(() => {
              // A concurrent download owns these flags until it finishes.
              if (!downloadingUpdate) {
                checkingForUpdates = false
              }
            })
            .then(() => {
              if (getConfig('update').automaticallyDownloadUpdates) {
                dispatch({
                  type: 'robotUpdate:DOWNLOAD_UPDATE',
                  meta: { shell: true },
                })
              }
            })
        }
        break
      case 'robotUpdate:DOWNLOAD_UPDATE':
        startRobotUpdateDownload(dispatch)
        break

      case 'robotUpdate:START_PREMIGRATION': {
        const robot = action.payload

        log.info('Starting robot premigration', { robot })

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        startPremigration(robot)
          .then((): RobotUpdateAction => ({
            type: 'robotUpdate:PREMIGRATION_DONE',
            payload: robot.name,
          }))
          .catch((error: Error): RobotUpdateAction => ({
            type: 'robotUpdate:PREMIGRATION_ERROR',
            payload: { message: error.message },
          }))
          .then(dispatch)

        break
      }

      case 'robotUpdate:READ_USER_FILE': {
        const { systemFile } = action.payload as { systemFile: string }
        return readFileAndDispatchInfo(dispatch, systemFile, true)
      }

      case 'robotUpdate:READ_SYSTEM_FILE': {
        const { target } = action.payload
        const filename = updateSet[target]?.system

        if (filename == null) {
          dispatch({
            type: 'robotUpdate:CHECKING_FOR_UPDATE',
            payload: target,
          })
          startRobotUpdateDownload(dispatch)
        } else {
          return readFileAndDispatchInfo(dispatch, filename)
        }
      }
    }
  }
}

export function getRobotSystemUpdateUrls(
  robot: RobotUpdateTarget
): Promise<ReleaseSetUrls | null> {
  const manifestUrls = getUpdateManifestUrls()

  return ensureDir(cacheDirForMachine(robot))
    .then(() =>
      downloadManifest(
        manifestUrls[robot],
        path.join(cacheDirForMachine(robot), 'releases.json')
      )
    )
    .then(manifest => {
      const urls = getReleaseSet(manifest, CURRENT_VERSION)

      // if (urls === null) {
      //   log.warn('No release files in manifest', {
      //     version: CURRENT_VERSION,
      //     manifest,
      //   })
      // }

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

export function getRobotSystemUpdateNotes(
  notesUrl: string,
  robot: RobotUpdateTarget
): Promise<string | null> {
  return ensureDir(cacheDirForMachine(robot))
    .then(() =>
      downloadNotes(
        notesUrl,
        path.join(cacheDirForMachine(robot), 'release-notes.md')
      )
    )
    .catch((error: Error) => {
      log.warn(`Error retrieving release notes: ${error}`)
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
export function checkForRobotUpdate(dispatch: Dispatch): Promise<void> {
  return getRobotSystemUpdateUrls('flex').then(urls => {
    if (urls === null) {
      dispatch({
        type: 'robotUpdate:UPDATE_VERSION',
        payload: { version: null, target: 'flex' },
      })
      return
    }
    if (urls?.releaseNotes == null) {
      // release without notes, which shouldn't happen but we handle it
      dispatch({
        type: 'robotUpdate:UPDATE_VERSION',
        payload: { version: CURRENT_VERSION, target: 'flex' },
      })
      return
    }
    getRobotSystemUpdateNotes(urls.releaseNotes, 'flex').then(notesContent => {
      dispatch({
        type: 'robotUpdate:UPDATE_INFO',
        payload: {
          target: 'flex',
          version: CURRENT_VERSION,
          force: false,
          releaseNotes: notesContent,
        },
      })
    })
  })
}

export function downloadRobotUpdate(dispatch: Dispatch): Promise<void> {
  let prevPercentDone = 0
  const handleProgress = (progress: DownloadProgress): void => {
    const { downloaded, size } = progress
    if (size !== null) {
      const percentDone = Math.round((downloaded / size) * 100)
      if (percentDone - prevPercentDone > 0) {
        dispatch({
          type: 'robotUpdate:DOWNLOAD_PROGRESS',
          payload: { progress: percentDone, target: 'flex' },
        })
      }
      prevPercentDone = percentDone
    }
  }

  const targetDownloadDir = cacheDirForMachineFiles('flex')
  return ensureDir(targetDownloadDir)
    .then(() => getRobotSystemUpdateUrls('flex'))
    .then(urls =>
      urls == null
        ? Promise.reject(new Error('nothing to download'))
        : getReleaseFiles(
            urls,
            targetDownloadDir,
            dispatch,
            'flex',
            handleProgress
          )
    )
    .then(filepaths => cacheUpdateSet(filepaths, 'flex'))
    .then(updateInfo => {
      dispatch({ type: 'robotUpdate:UPDATE_INFO', payload: updateInfo })
      dispatch({ type: 'robotUpdate:DOWNLOAD_DONE', payload: 'flex' })
    })
    .catch((error: Error) => {
      dispatch({
        type: 'robotUpdate:DOWNLOAD_ERROR',
        payload: { error: error.message, target: 'flex' },
      })
    })
    .then(() =>
      cleanupReleaseFiles(cacheDirForMachine('flex'), CURRENT_VERSION)
    )
}

function cacheUpdateSet(
  filepaths: ReleaseSetFilepaths,
  target: RobotUpdateTarget
): Promise<RobotUpdateInfo> {
  updateSet[target] = filepaths

  return readFile(filepaths.releaseNotes, 'utf8').then(releaseNotes => ({
    version: CURRENT_VERSION,
    releaseNotes,
    target,
  }))
}
