import { getFullConfig } from '../config'
import { updateConfigValue } from '../config/actions'
import { CHANGE_AUDIT_LOG_DIRECTORY } from '../constants'
import { showOpenDirectoryDialog } from '../dialogs'

import type { BrowserWindow } from 'electron'
import type { Action, Dispatch } from '../types'

export const AUDIT_LOG_DIRECTORY_CONFIG_PATH = 'audit.logDirectory'

export function registerLogLocation(
  dispatch: Dispatch,
  mainWindow: BrowserWindow
): Dispatch {
  return function handleActionForLogLocation(action: Action): void {
    if (action.type === CHANGE_AUDIT_LOG_DIRECTORY) {
      const { audit: config } = getFullConfig()
      const dialogOptions = {
        defaultPath: config.logDirectory ?? '',
        properties: ['openDirectory', 'createDirectory'],
      }

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      showOpenDirectoryDialog(mainWindow, dialogOptions).then(filePaths => {
        if (filePaths.length > 0) {
          dispatch(
            updateConfigValue(AUDIT_LOG_DIRECTORY_CONFIG_PATH, filePaths[0])
          )
        }
      })
    }
  }
}
