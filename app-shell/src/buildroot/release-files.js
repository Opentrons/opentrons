// @flow
// functions for downloading and storing release files
// TODO(mc, 2019-07-02): cleanup old downloads
import path from 'path'
import tempy from 'tempy'
import { move, readdir } from 'fs-extra'

import createLogger from '../log'
import { fetchToFile } from '../http'
import type { DownloadProgress } from '../http'
import type { ReleaseSetUrls, ReleaseSetFilepaths } from './types'

const log = createLogger(__filename)
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
      log.warn('Error retrieving files from FS', { error })
      return []
    })
    .then((files: Array<string>) => {
      log.debug('Files in buildroot download directory', { files })
      const system = outPath(directory, urls.system)
      const releaseNotes = urls.releaseNotes
        ? outPath(directory, urls.releaseNotes)
        : null

      // TODO(mc, 2019-07-02): this is a pretty naive filename check; we may
      // want to explore putting hashes in the manifest and checking those
      if (
        files.some(f => f === path.basename(system)) &&
        (releaseNotes === null ||
          files.some(f => f === path.basename(releaseNotes)))
      ) {
        return { system, releaseNotes }
      }

      return downloadReleaseFiles(urls, directory, onProgress)
    })
}

// downloads the entire release set to a temporary directory, and once they're
// all successfully downloaded, renames the directory to `directory`
export function downloadReleaseFiles(
  urls: ReleaseSetUrls,
  directory: string,
  // `onProgress` will be called with download progress as the files are read
  onProgress: (progress: DownloadProgress) => mixed
): Promise<ReleaseSetFilepaths> {
  const tempDir: string = tempy.directory()
  const systemPath = outPath(tempDir, urls.system)

  log.debug('directory created for BR downloads', { tempDir })

  // downloads are streamed directly to the filesystem to avoid loading them
  // all into memory simultaneously
  const systemReq = fetchToFile(urls.system, systemPath, { onProgress })

  const releaseNotesReq = urls.releaseNotes
    ? fetchToFile(urls.releaseNotes, outPath(tempDir, urls.releaseNotes))
    : Promise.resolve(null)

  return Promise.all([systemReq, releaseNotesReq]).then(results => {
    const [systemTemp, releaseNotesTemp] = results

    log.debug('renaming directory', { from: tempDir, to: directory })

    return move(tempDir, directory, { overwrite: true }).then(() => {
      const system = path.join(directory, path.basename(systemTemp))
      const releaseNotes =
        releaseNotesTemp !== null
          ? path.join(directory, path.basename(releaseNotesTemp))
          : null

      return { system, releaseNotes }
    })
  })
}
