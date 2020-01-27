// @flow
// functions for downloading and storing release files
// TODO(mc, 2019-07-02): cleanup old downloads
import assert from 'assert'
import path from 'path'
import { promisify } from 'util'
import tempy from 'tempy'
import { move, readdir } from 'fs-extra'
import StreamZip from 'node-stream-zip'
import getStream from 'get-stream'

import { createLogger } from '../log'
import { fetchToFile } from '../http'
import type { DownloadProgress } from '../http'
import type { ReleaseSetUrls, ReleaseSetFilepaths, UserFileInfo } from './types'

const VERSION_FILENAME = 'VERSION.json'

const log = createLogger('buildroot/release-files')
const outPath = (dir: string, url: string) => path.join(dir, path.basename(url))

// checks `directory` for buildroot files matching the given `urls`, and
// download them if they can't be found
export function getReleaseFiles(
  urls: ReleaseSetUrls,
  directory: string,
  onProgress: (progress: DownloadProgress) => mixed
): Promise<ReleaseSetFilepaths> {
  return readdir(directory)
    .catch(error => {
      log.warn('Error retrieving files from filesystem', { error })
      return []
    })
    .then((files: Array<string>) => {
      log.debug('Files in buildroot download directory', { files })
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

      return downloadReleaseFiles(urls, directory, onProgress)
    })
}

// downloads the entire release set to a temporary directory, and once they're
// all successfully downloaded, renames the directory to `directory`
// TODO(mc, 2019-07-09): DRY this up if/when more than 2 files are required
export function downloadReleaseFiles(
  urls: ReleaseSetUrls,
  directory: string,
  // `onProgress` will be called with download progress as the files are read
  onProgress: (progress: DownloadProgress) => mixed
): Promise<ReleaseSetFilepaths> {
  const tempDir: string = tempy.directory()
  const tempSystemPath = outPath(tempDir, urls.system)
  const tempNotesPath = outPath(tempDir, urls.releaseNotes)

  log.debug('directory created for BR downloads', { tempDir })

  // downloads are streamed directly to the filesystem to avoid loading them
  // all into memory simultaneously
  const systemReq = fetchToFile(urls.system, tempSystemPath, { onProgress })
  const notesReq = fetchToFile(urls.releaseNotes, tempNotesPath)

  return Promise.all([systemReq, notesReq]).then(results => {
    const [systemTemp, releaseNotesTemp] = results
    const systemPath = outPath(directory, systemTemp)
    const notesPath = outPath(directory, releaseNotesTemp)

    log.debug('renaming directory', { from: tempDir, to: directory })

    return move(tempDir, directory, { overwrite: true }).then(() => ({
      system: systemPath,
      releaseNotes: notesPath,
    }))
  })
}

export function readUserFileInfo(systemFile: string): Promise<UserFileInfo> {
  const openZip = new Promise((resolve, reject) => {
    const zip = new StreamZip({ file: systemFile, storeEntries: true })
      .once('ready', handleReady)
      .once('error', handleError)

    function handleReady() {
      cleanup()
      resolve(zip)
    }

    function handleError(error: Error) {
      cleanup()
      zip.close()
      reject(error)
    }

    function cleanup() {
      zip.removeListener('ready', handleReady)
      zip.removeListener('error', handleError)
    }
  })

  return openZip.then(zip => {
    const entries = zip.entries()
    const streamFromZip = promisify(zip.stream.bind(zip))

    assert(VERSION_FILENAME in entries, `${VERSION_FILENAME} not in archive`)

    const result = streamFromZip(VERSION_FILENAME)
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
