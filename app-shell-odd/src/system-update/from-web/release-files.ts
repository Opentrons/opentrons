// functions for downloading and storing release files

import path from 'path'
import tempy from 'tempy'
import { move, readdir, rm, mkdirp, readFile } from 'fs-extra'
import { fetchToFile } from '../../http'
import { createLogger } from '../../log'

import type { DownloadProgress } from '../../http'
import type { ReleaseSetUrls, ReleaseSetFilepaths } from '../types'
import type { Dirent } from 'fs'

const log = createLogger('systemUpdate/from-web/release-files')
const outPath = (dir: string, url: string): string => {
  return path.join(dir, path.basename(url))
}

const RELEASE_DIRECTORY_PREFIX = 'cached-release-'

export const directoryNameForRelease = (version: string): string =>
  `${RELEASE_DIRECTORY_PREFIX}${version}`

export const directoryForRelease = (
  baseDirectory: string,
  version: string
): string => path.join(baseDirectory, directoryNameForRelease(version))

async function ensureReleaseCache(baseDirectory: string): Promise<Dirent[]> {
  try {
    return await readdir(baseDirectory, { withFileTypes: true })
  } catch (error: any) {
    console.log(
      `Could not read download cache base directory: ${error.name}: ${error.message}: remaking`
    )
    await rm(baseDirectory, { force: true, recursive: true })
    await mkdirp(baseDirectory)
    return []
  }
}

export const ensureCleanReleaseCacheForVersion = (
  baseDirectory: string,
  version: string
): Promise<string> =>
  ensureReleaseCache(baseDirectory)
    .then(contents =>
      Promise.all(
        contents.map(contained =>
          !contained.isDirectory() ||
          contained.name !== directoryNameForRelease(version)
            ? rm(path.join(baseDirectory, contained.name), {
                force: true,
                recursive: true,
              })
            : new Promise<void>(resolve => {
                resolve()
              })
        )
      )
    )
    .then(() => mkdirp(directoryForRelease(baseDirectory, version)))
    .then(() => directoryForRelease(baseDirectory, version))

export interface ReleaseSetData extends ReleaseSetFilepaths {
  releaseNotesContent: string | null
}

export const augmentWithReleaseNotesContent = (
  releaseFiles: ReleaseSetFilepaths
): Promise<ReleaseSetData> =>
  releaseFiles.releaseNotes == null
    ? new Promise(resolve => {
        resolve({ ...releaseFiles, releaseNotesContent: null })
      })
    : readReleaseNotes(releaseFiles.releaseNotes)
        .then(releaseNotesContent => ({ ...releaseFiles, releaseNotesContent }))
        .catch(err => {
          log.error(
            `Release notes should be present but cannot be read: ${err.name}: ${err.message}`
          )
          return { ...releaseFiles, releaseNotesContent: null }
        })

// checks `directory` for system update files matching the given `urls`, and
// downloads them if they can't be found
export function getReleaseFiles(
  urls: ReleaseSetUrls,
  directory: string
): Promise<ReleaseSetData> {
  return readdir(directory).then((files: string[]) => {
    log.info(`Files in system update download directory ${directory}: ${files}`)
    const expected = {
      system: path.basename(urls.system),
      releaseNotes:
        urls?.releaseNotes == null ? null : path.basename(urls.releaseNotes),
    }
    const foundFiles = files.reduce<Partial<ReleaseSetFilepaths>>(
      (
        releaseSetFilePaths: Partial<ReleaseSetFilepaths>,
        thisFile: string
      ): Partial<ReleaseSetFilepaths> => {
        if (thisFile === expected.system) {
          return { ...releaseSetFilePaths, system: thisFile }
        }
        if (
          expected.releaseNotes != null &&
          thisFile === expected.releaseNotes
        ) {
          return { ...releaseSetFilePaths, releaseNotes: thisFile }
        }
        return releaseSetFilePaths
      },
      {}
    )
    if (foundFiles?.system != null) {
      const files = {
        system: outPath(directory, foundFiles.system),
        releaseNotes:
          foundFiles?.releaseNotes != null
            ? outPath(directory, foundFiles.releaseNotes)
            : null,
      }
      log.info(
        `Found system file ${foundFiles.system} in cache directory ${directory}`
      )
      return augmentWithReleaseNotesContent(files)
    }

    throw new Error(
      `no release files cached: could not find system file ${outPath(
        directory,
        urls.system
      )} in ${files}`
    )
  })
}

// downloads the entire release set to a temporary directory, and once they're
// all successfully downloaded, renames the directory to `directory`
export function downloadReleaseFiles(
  urls: ReleaseSetUrls,
  directory: string,
  // `onProgress` will be called with download progress as the files are read
  onProgress: (progress: DownloadProgress) => void,
  canceller: AbortController
): Promise<ReleaseSetData> {
  const tempDir: string = tempy.directory()
  const tempSystemPath = outPath(tempDir, urls.system)
  const tempNotesPath = outPath(tempDir, urls.releaseNotes ?? '')
  // downloads are streamed directly to the filesystem to avoid loading them
  // all into memory simultaneously
  const notesReq =
    urls.releaseNotes != null
      ? fetchToFile(urls.releaseNotes, tempNotesPath, {
          signal: canceller.signal,
        }).catch(err => {
          log.warn(
            `release notes not available from ${urls.releaseNotes}: ${err.name}: ${err.message}`
          )
          return null
        })
      : Promise.resolve(null)
  if (urls.releaseNotes != null) {
    log.info(`Downloading ${urls.releaseNotes} to ${tempNotesPath}`)
  } else {
    log.info('No release notes available, not downloading')
  }
  log.info(`Downloading ${urls.system} to ${tempSystemPath}`)
  const systemReq = fetchToFile(urls.system, tempSystemPath, {
    onProgress,
    signal: canceller.signal,
  })
  return Promise.all([systemReq, notesReq])
    .then(results => {
      const [systemTemp, releaseNotesTemp] = results
      const systemPath = outPath(directory, systemTemp)
      const notesPath = releaseNotesTemp
        ? outPath(directory, releaseNotesTemp)
        : null

      log.info(`Download complete, ${tempDir}=>${directory}`)

      return move(tempDir, directory, { overwrite: true }).then(() => {
        log.info(`Move complete`)
        return augmentWithReleaseNotesContent({
          system: systemPath,
          releaseNotes: notesPath,
        })
      })
    })
    .catch(error => {
      log.error(
        `Failed to download release files: ${error.name}: ${error.message}`
      )
      return rm(tempDir, { force: true, recursive: true }).then(() => {
        throw error
      })
    })
}

export async function getOrDownloadReleaseFiles(
  urls: ReleaseSetUrls,
  releaseCacheDirectory: string,
  onProgress: (progress: DownloadProgress) => void,
  canceller: AbortController
): Promise<ReleaseSetData> {
  try {
    return await getReleaseFiles(urls, releaseCacheDirectory)
  } catch (error: any) {
    log.info(
      `Could not find cached release files for  ${releaseCacheDirectory}: ${error.name}: ${error.message}, attempting to download`
    )
    return await downloadReleaseFiles(
      urls,
      releaseCacheDirectory,
      onProgress,
      canceller
    )
  }
}

export const cleanUpAndGetOrDownloadReleaseFiles = (
  urls: ReleaseSetUrls,
  baseDirectory: string,
  version: string,
  onProgress: (progress: DownloadProgress) => void,
  canceller: AbortController
): Promise<ReleaseSetData> =>
  ensureCleanReleaseCacheForVersion(baseDirectory, version).then(versionCache =>
    getOrDownloadReleaseFiles(urls, versionCache, onProgress, canceller)
  )

const readReleaseNotes = (path: string | null): Promise<string | null> =>
  path == null
    ? new Promise(resolve => {
        resolve(null)
      })
    : readFile(path, { encoding: 'utf-8' }).catch(err => {
        log.warn(
          `Could not read release notes from ${path}: ${err.name}: ${err.message}`
        )
        return null
      })
