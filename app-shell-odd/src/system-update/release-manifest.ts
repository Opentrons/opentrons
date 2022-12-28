import { readJson, writeJson } from 'fs-extra'
import { fetchJson } from '../http'
import { getManifestCacheDir } from './directories'
import type { ReleaseManifest, ReleaseSetUrls } from './types'

export function getReleaseSet(
  manifest: ReleaseManifest,
  version: string
): ReleaseSetUrls | null {
  return manifest.production[version] ?? null
}

export const getCachedReleaseManifest = (): Promise<ReleaseManifest> =>
  readJson(getManifestCacheDir())

export const downloadAndCacheReleaseManifest = (
  manifestUrl: string
): Promise<ReleaseManifest> =>
  fetchJson<ReleaseManifest>(manifestUrl)
    .then(manifest => {
      return writeJson(getManifestCacheDir(), manifest).then(() => manifest)
    })
    .catch(() => readJson(getManifestCacheDir()))
