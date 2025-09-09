import path from 'path'
import { app } from 'electron'

import { getConfig } from '../config'

import type { BrowserWindowConstructorOptions } from 'electron'

export const SECONDARY_WINDOW_CONFIG = getConfig('ui')

// Default window options.
// Do not modify these settings directly, but update the relevant ui builder.
export const SECONDARY_WINDOW_OPTS: BrowserWindowConstructorOptions = {
  show: false,
  useContentSize: true,
  width: 500,
  height: 413,
  minWidth: 400,
  minHeight: 300,
  webPreferences: Object.assign(
    {
      // NOTE: __dirname refers to output directory
      preload: path.join(__dirname, './preload.js'),
      nodeIntegration: false,
      // TODO: remove this by using electron contextBridge
      contextIsolation: false,
    },
    SECONDARY_WINDOW_CONFIG.webPreferences
  ),
}

export const SECONDARY_WINDOW_URL_PATH =
  SECONDARY_WINDOW_CONFIG.url.protocol === 'file:'
    ? path.join(app.getAppPath(), SECONDARY_WINDOW_CONFIG.url.path)
    : SECONDARY_WINDOW_CONFIG.url.path
