import { mkdir, rmdir } from 'fs/promises'
import path from 'path'

import {
  logPeriodDownloadCanceled,
  logPeriodDownloadFailed,
  logPeriodDownloadSucceeded,
} from '@opentrons/app/src/redux/audit/slice'

import { getFullConfig } from '../config'
import { updateConfigValue } from '../config/actions'
import {
  CHANGE_AUDIT_LOG_DIRECTORY,
  DOWNLOAD_AUDIT_LOG,
  DOWNLOAD_AUDIT_LOGS,
} from '../constants'
import { showOpenDirectoryDialog } from '../dialogs'
import { fetchToFile } from '../http'
import { buildRobotHttpUrl } from '../robot-update/httpUrl'

import type { BrowserWindow } from 'electron'
import type {
  DownloadAuditLogPayload,
  DownloadAuditLogsPayload,
} from '@opentrons/app/src/redux/audit/types'
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
    if (action.type === DOWNLOAD_AUDIT_LOGS) {
      void downloadAuditLogs(action.payload, mainWindow, dispatch)
    }
  }
}

async function downloadAuditLog(
  payload: DownloadAuditLogPayload,
  mainWindow: BrowserWindow,
  dispatch: Dispatch
): Promise<boolean> {
  const { logPeriodId, fileName, host, destination } = payload
  const { hostname, port } = host
  const url = buildRobotHttpUrl(
    { ip: hostname, port },
    `/audit/external/logPeriods/${logPeriodId}/download`
  )
  const config = getFullConfig()

  let directory = destination

  if (!directory) {
    const defaultDirectory = config.audit.logDirectory
    const dialogOptions = {
      defaultPath: defaultDirectory ?? '',
      properties: ['openDirectory', 'createDirectory'],
    }
    const filePaths = await showOpenDirectoryDialog(mainWindow, dialogOptions)
    directory = filePaths[0]?.toString()
    if (!directory) {
      dispatch(logPeriodDownloadCanceled({ logPeriodId }) as Action)
      return false
    }
  }

  try {
    const filePath = path.join(directory, fileName)
    let deletionKey: string | null = null

    await fetchToFile(url, filePath, {
      onResponse: response => {
        deletionKey = response.headers.get('opentrons-log-period-deletion-key')
      },
    })

    if (deletionKey == null) {
      dispatch(
        logPeriodDownloadFailed({
          logPeriodId,
          error: 'Missing deletion key in download response',
        }) as Action
      )
      return false
    }

    dispatch(logPeriodDownloadSucceeded({ logPeriodId, deletionKey }) as Action)
    return true
  } catch (error) {
    dispatch(
      logPeriodDownloadFailed({
        logPeriodId,
        error: error instanceof Error ? error.message : String(error),
      }) as Action
    )
    return false
  }
}

async function downloadAuditLogs(
  payload: DownloadAuditLogsPayload,
  mainWindow: BrowserWindow,
  dispatch: Dispatch
): Promise<void> {
  const { logPeriodSummaries, host, destination, robotName } = payload

  const config = getFullConfig()

  let directory = destination

  if (!directory) {
    const defaultDirectory = config.audit.logDirectory
    const dialogOptions = {
      defaultPath: defaultDirectory ?? '',
      properties: ['openDirectory', 'createDirectory'],
    }
    const filePaths = await showOpenDirectoryDialog(mainWindow, dialogOptions)
    directory = filePaths[0]?.toString()
  }

  const folderName =
    `${robotName}-audit-logs-${new Date().toISOString()}`.replace(
      /[^a-zA-Z0-9._-]/g,
      '_'
    )
  const outputDirectory = !directory ? null : path.join(directory, folderName)
  if (outputDirectory != null) {
    await mkdir(outputDirectory, { recursive: true })
  }

  const results = await Promise.all(
    logPeriodSummaries.map(logPeriodSummary => {
      if (!outputDirectory) {
        dispatch(
          logPeriodDownloadCanceled({ logPeriodId: logPeriodSummary.id })
        )
        return Promise.resolve()
      }

      return downloadAuditLog(
        {
          logPeriodId: logPeriodSummary.id,
          fileName: `logperiod_${logPeriodSummary.startedAt.replaceAll(':', '_')}.zip`,
          host,
          destination: outputDirectory,
        },
        mainWindow,
        dispatch
      )
    })
  )

  if (!!outputDirectory && results.every(succeeded => !succeeded)) {
    await rmdir(outputDirectory)
  }
}
