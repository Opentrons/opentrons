import { app } from 'electron'
import path from 'path'
import { SYSTEM_UPDATE_DIRECTORY } from './constants'

export const getSystemUpdateDir = (): string =>
  path.join(app.getPath('sessionData'), SYSTEM_UPDATE_DIRECTORY)
