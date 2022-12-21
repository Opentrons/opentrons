// functions for downloading and storing release files
import assert from 'assert'
import path from 'path'
import { promisify } from 'util'
import tempy from 'tempy'
import { move, readdir, remove } from 'fs-extra'
import StreamZip from 'node-stream-zip'
import getStream from 'get-stream'

import { createLogger } from '../log'
import { fetchToFile } from '../http'
import type { DownloadProgress } from '../http'
import type { ReleaseSetUrls, ReleaseSetFilepaths, UserFileInfo } from './types'

const VERSION_FILENAME = 'VERSION.json'

const log = createLogger('bulsildroot/release-files')
const outPath = (dir: string, url: string): string => {
  return path.join(dir, path.basename(url))
}

// checks `directory` for buildroot files matching the given `urls`, and
// download them if they can't be found
export function getReleaseFiles(
  urls: ReleaseSetUrls,
  directory: string,
  onProgress: (progress: DownloadProgress) => unknown
): Promise<ReleaseSetFilepaths> {
  console.log('getting the release files')
  console.log({ urls })
  return readdir(directory)
    .catch(error => {
      console.log('Error retrieving files from filesystem', { error })
      log.warn('Error retrieving files from filesystem', { error })
      return []
    })
    .then((files: string[]) => {
      console.log('Files in buildroot download directoryy', { files })
      log.debug('Files in buildroot download directory', { files })
      console.log('files length: ', files.length)
      console.log('before call to outPath')
      const system = outPath(directory, urls.system)
      const releaseNotes = outPath(directory, urls.releaseNotes ?? '')
      console.log('after call to outPath')
      console.log({ system, releaseNotes })

      // TODO(mc, 2019-07-02): this is a pretty naive filename check; we may
      // want to explore putting hashes in the manifest and checking those
      console.log('path basename info')
      console.log(path.basename(system))
      console.log(path.basename(releaseNotes))
      if (files.some(f => f === path.basename(system))) {
        console.log('weve got a match!')
        console.log({ system, releaseNotes })
        return { system, releaseNotes }
      }

      console.log('downloading the release files')

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
  onProgress: (progress: DownloadProgress) => unknown
): Promise<ReleaseSetFilepaths> {
  const tempDir: string = tempy.directory()
  urls.releaseNotes = null
  const tempSystemPath = outPath(tempDir, urls.system)
  const tempNotesPath = outPath(tempDir, urls.releaseNotes ?? '')

  log.debug('directory created for BR downloads', { tempDir })
  console.log('directory created for BR downloads', { tempDir })

  // downloads are streamed directly to the filesystem to avoid loading them
  // all into memory simultaneously
  console.log('fetching system req')
  const systemReq = fetchToFile(urls.system, tempSystemPath, { onProgress })
  console.log('fetching notes req')
  const notesReq = urls.releaseNotes
    ? fetchToFile(urls.releaseNotes, tempNotesPath)
    : Promise.resolve('')

  console.log({ systemReq, notesReq })

  return Promise.all([systemReq, notesReq]).then(results => {
    console.log('in promise all')
    const [systemTemp, releaseNotesTemp] = results
    console.log({ systemTemp, releaseNotesTemp })
    const systemPath = outPath(directory, systemTemp)
    const notesPath = outPath(directory, releaseNotesTemp)

    log.debug('renaming directory', { from: tempDir, to: directory })
    console.log('renaming directory', { from: tempDir, to: directory })

    return move(tempDir, directory, { overwrite: true }).then(() => ({
      system: systemPath,
      releaseNotes: notesPath,
    }))
  })
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

    result.finally(() => zip.close())

    return result
  })
}

export function cleanupReleaseFiles(
  downloadsDir: string,
  currentRelease: string
): Promise<unknown> {
  console.log('cleaning up release files')
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
