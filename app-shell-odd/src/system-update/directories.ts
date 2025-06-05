import path from 'path'
import { app } from 'electron'

import { SYSTEM_UPDATE_DIRECTORY } from './constants'

export const getSystemUpdateDir = (): string =>
  path.join(app.getPath('userData'), SYSTEM_UPDATE_DIRECTORY)
