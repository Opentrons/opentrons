// @flow
// functions and utilities for retrieving the releases manifest
import fse from 'fs-extra'
import { fetchJson } from '../http'
import type { ReleaseManifest, ReleaseSetUrls } from './types'

export function downloadManifest(
  manifestUrl: string,
  cacheFilePath: string
): Promise<ReleaseManifest> {
  return fetchJson(manifestUrl)
    .then(result => {
      return fse.writeJson(cacheFilePath, result).then(() => result)
    })
    .catch(() => fse.readJson(cacheFilePath))
}

// TODO(mc, 2019-07-02): retrieve something other than "production"
export function getReleaseSet(
  manifest: ReleaseManifest,
  version: string
): ReleaseSetUrls | null {
  return manifest.production[version] || null
}
