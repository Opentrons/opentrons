// functions for downloading and storing release files

import path from 'path'
import { mkdirp, move, readdir, readFile, rm } from 'fs-extra'

import { fetchToFile } from '../../http'
import { createLogger } from '../../log'

import type { Dirent } from 'fs'
import type { DownloadProgress } from '../../http'
import type { ReleaseSetUrls } from '../types'

const log = createLogger('systemUpdate/from-web/release-files')

const DOWNLOAD_ARTIFACT_SUFFIX = '.odd-download'
const outPath = (dir: string, url: string): string => {
  return path.join(dir, path.basename(url))
}
const dlPath = (dir: string, url: string): string => {
  return path.join(dir, path.basename(url)) + DOWNLOAD_ARTIFACT_SUFFIX
}
const outPathFromDlPath = (dlPath: string): string => {
  return dlPath.slice(0, -DOWNLOAD_ARTIFACT_SUFFIX.length)
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

export interface ReleaseSetData {
  system: string
  releaseNotes: string | null
  releaseNotesContent: string | null
}

export const augmentWithReleaseNotesContent = (releaseFiles: {
  system: string
  releaseNotes: string | null
}): Promise<ReleaseSetData> =>
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

// checks `directory` for system update files matching the given `urls`, returning them
// if they exist and throwing if they do not
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
    const foundFiles = files.reduce<
      Partial<{ system: string; releaseNotes: string | null }>
    >(
      (
        releaseSetFilePaths: Partial<{
          system: string
          releaseNotes: string | null
        }>,
        thisFile: string
      ): Partial<{ system: string; releaseNotes: string | null }> => {
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

export function downloadReleaseNotes(
  url: string | null,
  directory: string,
  canceller: AbortController
): Promise<{
  releaseNotes: string | null
  releaseNotesContent: string | null
}> {
  return url == null
    ? Promise.resolve({ releaseNotes: null, releaseNotesContent: null })
    : fetchToFile(url, dlPath(directory, url), { signal: canceller.signal })
        .then(releaseNotesTemp =>
          move(releaseNotesTemp, outPathFromDlPath(releaseNotesTemp), {
            overwrite: true,
          }).then(() => outPathFromDlPath(releaseNotesTemp))
        )
        .then(releaseNotes => {
          return readReleaseNotes(releaseNotes).then(releaseNotesContent => ({
            releaseNotes,
            releaseNotesContent,
          }))
        })
        .finally(() => rm(dlPath(directory, url), { force: true }))
}

export const getReleaseFilesIfExist = (
  urls: ReleaseSetUrls,
  baseDirectory: string,
  version: string
): Promise<ReleaseSetData | null> =>
  getReleaseFiles(urls, directoryForRelease(baseDirectory, version)).catch(
    (_: unknown) => null
  )

export function downloadSystemZip(
  systemZipUrl: string,
  directory: string,
  // `onProgress` will be called with download progress as the files are read
  onProgress: (progress: DownloadProgress) => void,
  canceller: AbortController
): Promise<{ system: string }> {
  // downloads are streamed directly to the filesystem to avoid loading them
  // all into memory simultaneously
  log.info(`Downloading ${systemZipUrl} to ${dlPath(directory, systemZipUrl)}`)
  return fetchToFile(systemZipUrl, dlPath(directory, systemZipUrl), {
    onProgress,
    signal: canceller.signal,
  })
    .then(systemTemp => {
      return move(systemTemp, outPathFromDlPath(systemTemp), {
        overwrite: true,
      }).then(() => ({ system: outPathFromDlPath(systemTemp) }))
    })
    .finally(() => rm(dlPath(directory, systemZipUrl)))
}

export function downloadReleaseFiles(
  urls: ReleaseSetUrls,
  releaseCacheDirectory: string,
  onProgress: (progress: DownloadProgress) => void,
  canceller: AbortController
): Promise<ReleaseSetData> {
  return Promise.all([
    downloadSystemZip(
      urls.system,
      releaseCacheDirectory,
      onProgress,
      canceller
    ),
    downloadReleaseNotes(
      urls.releaseNotes ?? null,
      releaseCacheDirectory,
      canceller
    ),
  ]).then(([system, releaseNotes]) => ({ ...system, ...releaseNotes }))
}

export const cleanUpAndDownloadReleaseFiles = (
  urls: ReleaseSetUrls,
  baseDirectory: string,
  version: string,
  onProgress: (progress: DownloadProgress) => void,
  canceller: AbortController
): Promise<ReleaseSetData> =>
  ensureCleanReleaseCacheForVersion(baseDirectory, version).then(versionCache =>
    downloadReleaseFiles(urls, versionCache, onProgress, canceller)
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

const removeTemporaryDownloadsFromReleaseDir = async (
  releaseDir: string
): Promise<void> => {
  try {
    const releaseContents = await readdir(releaseDir, { withFileTypes: true })
    const tempDls = releaseContents.filter(contentsDirent =>
      contentsDirent.name.endsWith(DOWNLOAD_ARTIFACT_SUFFIX)
    )
    log.warn(`Found ${tempDls.length} leftover downloads in ${releaseDir}`)
    await Promise.allSettled(
      tempDls.map(tdl => rm(path.join(tdl.parentPath, tdl.name)))
    )
  } catch (e: unknown) {
    log.warn(`Failed to read ${releaseDir}: ${e}`)
  }
}

export const removeTemporaryDownloads = async (
  baseDirectory: string
): Promise<void> => {
  const releaseDirs = await ensureReleaseCache(baseDirectory)
  await Promise.allSettled(
    releaseDirs.map(releaseDirent =>
      removeTemporaryDownloadsFromReleaseDir(
        path.join(releaseDirent.parentPath, releaseDirent.name)
      )
    )
  )
}
