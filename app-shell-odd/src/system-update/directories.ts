import path from 'path'

import { SYSTEM_UPDATE_DIRECTORY } from './constants'

export const getSystemUpdateDir = (): string => SYSTEM_UPDATE_DIRECTORY

export const getFileDownloadDir = (version: string): string =>
  path.join(SYSTEM_UPDATE_DIRECTORY, version)

export const getManifestCacheDir = (): string =>
  path.join(SYSTEM_UPDATE_DIRECTORY, 'releases.json')
