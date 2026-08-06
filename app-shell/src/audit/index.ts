import path from 'path'

import { logPeriodDeletionKeyReceived } from '@opentrons/app/src/redux/audit'

import { getFullConfig } from '../config'
import { updateConfigValue } from '../config/actions'
import { CHANGE_AUDIT_LOG_DIRECTORY, DOWNLOAD_AUDIT_LOG } from '../constants'
import { showOpenDirectoryDialog } from '../dialogs'
import { fetchToFile } from '../http'

import type { BrowserWindow } from 'electron'
import type { DownloadAuditLogPayload } from '@opentrons/app/src/redux/audit'
import type { Action, Dispatch } from '../types'

export const AUDIT_LOG_DIRECTORY_CONFIG_PATH = 'audit.logDirectory'

export function registerAudit(
  dispatch: Dispatch,
  mainWindow: BrowserWindow
): Dispatch {
  return function handleActionForAudit(action: Action): void {
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
    if (action.type === DOWNLOAD_AUDIT_LOG) {
      void downloadAuditLog(action.payload, mainWindow, dispatch)
    }
  }
}

async function downloadAuditLog(
  payload: DownloadAuditLogPayload,
  mainWindow: BrowserWindow,
  dispatch: Dispatch
): Promise<void> {
  const { logPeriodId, fileName, host } = payload
  const { hostname, port } = host
  const url = `http://${hostname}:${port}/logs/${logPeriodId}/download`

  const config = getFullConfig()
  let directory = config.audit.logDirectory

  const dialogOptions = {
    defaultPath: directory ?? '',
    properties: ['openDirectory', 'createDirectory'],
  }

  await showOpenDirectoryDialog(mainWindow, dialogOptions).then(
    async filePaths => {
      directory = filePaths[0].toString()
      if (!directory) {
        return
      }
      const filePath = path.join(directory, fileName)

      await fetchToFile(url, filePath, {
        onResponse: response => {
          const deletionKey = response.headers.get(
            'opentrons-log-period-deletion-key'
          )
          if (deletionKey != null) {
            dispatch(logPeriodDeletionKeyReceived({ logPeriodId, deletionKey }))
          }
        },
      })

      return true
    }
  )
}
