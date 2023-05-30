import { app } from 'electron'
import path from 'path'

const SYSTEM_UPDATE_DIRECTORY = path.join(
  app.getPath('sessionData'),
  '__ot_system_update__'
)

export const getSystemUpdateDir = (): string => SYSTEM_UPDATE_DIRECTORY

export const getFileDownloadDir = (version: string): string =>
  path.join(SYSTEM_UPDATE_DIRECTORY, version)

export const getManifestCacheDir = (): string =>
  path.join(SYSTEM_UPDATE_DIRECTORY, 'releases.json')
