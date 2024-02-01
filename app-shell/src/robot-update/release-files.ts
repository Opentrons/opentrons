// functions for downloading and storing release files
import assert from 'assert'
import path from 'path'
import { promisify } from 'util'
import tempy from 'tempy'
import { move, readdir, remove, readFile } from 'fs-extra'
import StreamZip from 'node-stream-zip'
import getStream from 'get-stream'

import { RobotUpdateTarget } from '@opentrons/app/src/redux/robot-update/types'

import { createLogger } from '../log'
import { fetchToFile } from '../http'
import { Dispatch } from '../types'
import { CURRENT_VERSION } from '../update'

import type { DownloadProgress } from '../http'
import type { ReleaseSetUrls, ReleaseSetFilepaths, UserFileInfo } from './types'

const VERSION_FILENAME = 'VERSION.json'

const log = createLogger('robotUpdate/release-files')
const outPath = (dir: string, url: string): string =>
  path.join(dir, path.basename(url))

// checks `directory` for robot update files matching the given `urls`, and
// download them if they can't be found
export function getReleaseFiles(
  urls: ReleaseSetUrls,
  directory: string,
  dispatch: Dispatch,
  target: RobotUpdateTarget,
  onProgress: (progress: DownloadProgress) => unknown
): Promise<ReleaseSetFilepaths> {
  return readdir(directory)
    .catch(error => {
      log.warn('Error retrieving files from filesystem', { error })
      return []
    })
    .then((files: string[]) => {
      log.debug('Files in robot update download directory', { files })
      const system = outPath(directory, urls.system)
      const releaseNotes = outPath(directory, urls.releaseNotes)

      // TODO(mc, 2019-07-02): this is a pretty naive filename check; we may
      // want to explore putting hashes in the manifest and checking those
      if (
        files.some(f => f === path.basename(system)) &&
        files.some(f => f === path.basename(releaseNotes))
      ) {
        return { system, releaseNotes }
      }

      return Promise.all([
        downloadAndNotify(true, urls.releaseNotes, directory, dispatch, target),
        downloadAndNotify(
          false,
          urls.system,
          directory,
          dispatch,
          target,
          onProgress
        ),
      ]).then(([releaseNotes, system]) => ({ releaseNotes, system }))
    })
}

// downloads robot update files to a temporary directory, and once
// successfully downloaded, renames the directory to `directory`
// TODO(mc, 2019-07-09): DRY this up if/when more than 2 files are required
export function downloadAndNotify(
  isReleaseNotesDownload: boolean,
  url: ReleaseSetUrls['releaseNotes' | 'system'],
  directory: string,
  dispatch: Dispatch,
  target: RobotUpdateTarget,
  // `onProgress` will be called with download progress as the files are read
  onProgress?: (progress: DownloadProgress) => unknown
): Promise<string> {
  const tempDir: string = tempy.directory()
  const tempPath = outPath(tempDir, url)
  const path = outPath(directory, tempPath)
  const logMessage = isReleaseNotesDownload ? 'release notes' : 'system files'

  log.debug('directory created for ' + logMessage, { tempDir })

  // downloads are streamed directly to the filesystem to avoid loading them
  // all into memory simultaneously
  const req = fetchToFile(url, tempPath, {
    onProgress,
  })

  return req.then(() => {
    return move(tempPath, path, { overwrite: true })
      .then(() => {
        if (isReleaseNotesDownload) {
          return readFile(path, 'utf8').then(releaseNotes =>
            dispatch({
              type: 'robotUpdate:UPDATE_INFO',
              payload: { releaseNotes, target, version: CURRENT_VERSION },
            })
          )
        }
        // This action will only have an effect if the user is actively waiting for the download to complete.
        else {
          return dispatch({
            type: 'robotUpdate:DOWNLOAD_DONE',
            payload: target,
          })
        }
      })
      .then(() => path)
  })
}

export function readUpdateFileInfo(systemFile: string): Promise<UserFileInfo> {
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

    result.finally(() => zip.close())

    return result
  })
}

export function cleanupReleaseFiles(
  downloadsDir: string,
  currentRelease: string
): Promise<unknown> {
  return readdir(downloadsDir, { withFileTypes: true })
    .then(files => {
      return (
        files
          // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
          .filter(f => f.isDirectory() && f.name !== currentRelease)
          .map(f => path.join(downloadsDir, f.name))
      )
    })
    .then(removals => Promise.all(removals.map(f => remove(f))))
}
