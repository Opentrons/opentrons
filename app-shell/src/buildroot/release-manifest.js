// @flow
// functions and utilities for retrieving the releases manifest
import { fetchJson } from '../http'
import type { ReleaseManifest, ReleaseSetUrls } from './types'

// TODO(mc, 2019-07-02): cache downloaded manifest
export function downloadManifest(
  manifestUrl: string
): Promise<ReleaseManifest> {
  return fetchJson(manifestUrl)
}

// TODO(mc, 2019-07-02): retrieve something other than "production"
export function getReleaseSet(
  manifest: ReleaseManifest,
  version: string
): ReleaseSetUrls | null {
  return manifest.production[version] || null
}
