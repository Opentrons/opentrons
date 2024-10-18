import * as FS from 'fs/promises'
import path from 'path'
import { readJson, outputJson } from 'fs-extra'

import type { Stats } from 'fs'
import { fetchJson, LocalAbortError } from '../../http'
import type { ReleaseManifest, ReleaseSetUrls } from '../types'
import { createLogger } from '../../log'

const log = createLogger('systemUpdate/from-web/provider')

export function getReleaseSet(
  manifest: ReleaseManifest,
  version: string
): ReleaseSetUrls | null {
  return manifest.production[version] ?? null
}

export const getCachedReleaseManifest = (
  cacheDir: string
): Promise<ReleaseManifest> => readJson(`${cacheDir}/manifest.json`)

const removeAndRemake = (directory: string): Promise<Stats> =>
  FS.rm(directory, { recursive: true, force: true })
    .then(() => FS.mkdir(directory, { recursive: true }))
    .then(() => FS.stat(directory))

export const ensureCacheDir = (directory: string): Promise<string> =>
  FS.stat(directory)
    .catch(() => removeAndRemake(directory))
    .then(stats =>
      stats.isDirectory()
        ? new Promise(resolve => {
            resolve(stats)
          })
        : removeAndRemake(directory)
    )
    .then(() => FS.readdir(directory, { withFileTypes: true }))
    .then(contents => {
      const manifestCandidate = contents.find(
        entry => entry.name === 'manifest.json'
      )
      if (manifestCandidate == null || manifestCandidate.isFile()) {
        return new Promise(resolve => {
          resolve(directory)
        })
      }
      return FS.rm(path.join(directory, 'manifest.json'), {
        force: true,
        recursive: true,
      }).then(() => directory)
    })

export const downloadManifest = (
  manifestUrl: string,
  cacheDir: string,
  cancel: AbortController
): Promise<ReleaseManifest> => {
  log.info(`Attempting to fetch release manifest from ${manifestUrl}`)
  return fetchJson<ReleaseManifest>(manifestUrl, {
    signal: cancel.signal,
  }).then(manifest => {
    log.info('Fetched release manifest OK')
    return outputJson(path.join(cacheDir, 'manifest.json'), manifest).then(
      () => manifest
    )
  })
}

export const ensureCacheDirAndDownloadManifest = (
  manifestUrl: string,
  cacheDir: string,
  cancel: AbortController
): Promise<ReleaseManifest> =>
  ensureCacheDir(cacheDir).then(ensuredCacheDir =>
    downloadManifest(manifestUrl, ensuredCacheDir, cancel)
  )

export async function getOrDownloadManifest(
  manifestUrl: string,
  cacheDir: string,
  cancel: AbortController
): Promise<ReleaseManifest> {
  try {
    return await ensureCacheDirAndDownloadManifest(
      manifestUrl,
      cacheDir,
      cancel
    )
  } catch (error: any) {
    if (error instanceof LocalAbortError) {
      log.info('Aborted during manifest fetch')
      throw error
    } else {
      log.info(
        `Could not fetch manifest: ${error.name}: ${error.message}, falling back to cached`
      )
      return await getCachedReleaseManifest(cacheDir)
    }
  }
}
