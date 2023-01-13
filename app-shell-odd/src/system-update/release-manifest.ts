import { readJson, outputJson } from 'fs-extra'
import { fetchJson } from '../http'
import { createLogger } from '../log'
import { getManifestCacheDir } from './directories'
import type { ReleaseManifest, ReleaseSetUrls } from './types'

const log = createLogger('systemUpdate/release-manifest')

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
      return outputJson(getManifestCacheDir(), manifest).then(() => manifest)
    })
    .catch((error: Error) => {
      log.error('Error downloading the release manifest', { error })
      return readJson(getManifestCacheDir())
    })
