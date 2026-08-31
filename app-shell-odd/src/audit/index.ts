import { constants } from 'fs'
import { access, mkdir, rmdir } from 'fs/promises'
import path from 'path'

import {
  logPeriodDownloadFailed,
  logPeriodDownloadSucceeded,
} from '@opentrons/app/src/redux/audit/slice'

import { DOWNLOAD_AUDIT_LOG, DOWNLOAD_AUDIT_LOGS } from '../constants'
import { fetchToFile } from '../http'
import { buildRobotHttpUrl } from '../system-update/httpUrl'

import type {
  DownloadAuditLogPayload,
  DownloadAuditLogsPayload,
} from '@opentrons/app/src/redux/audit/types'
import type { Action, Dispatch } from '../types'

export const MISSING_USB_DESTINATION_ERROR = 'No USB destination provided'
export const UNWRITABLE_USB_DESTINATION_ERROR =
  'USB device not found or not writable'
export const MISSING_DELETION_KEY_ERROR =
  'Missing deletion key in download response'

export function registerAudit(dispatch: Dispatch): Dispatch {
  return function handleActionForAudit(action: Action): void {
    if (action.type === DOWNLOAD_AUDIT_LOG) {
      void downloadAuditLog(action.payload, dispatch)
    }
    if (action.type === DOWNLOAD_AUDIT_LOGS) {
      void downloadAuditLogs(action.payload, dispatch)
    }
  }
}

async function downloadAuditLog(
  payload: DownloadAuditLogPayload,
  dispatch: Dispatch
): Promise<boolean> {
  const { logPeriodId, fileName, hostname, port, destination } = payload

  if (destination == null || destination === '') {
    failDownload(dispatch, logPeriodId, MISSING_USB_DESTINATION_ERROR)
    return false
  }

  try {
    await access(destination, constants.W_OK)
  } catch {
    failDownload(dispatch, logPeriodId, UNWRITABLE_USB_DESTINATION_ERROR)
    return false
  }

  const url = buildRobotHttpUrl(
    { ip: hostname, port },
    `/audit/external/logPeriods/${logPeriodId}/download`
  )

  try {
    const filePath = path.join(destination, fileName)
    let deletionKey: string | null = null

    await fetchToFile(url, filePath, {
      onResponse: response => {
        deletionKey = response.headers.get('opentrons-log-period-deletion-key')
      },
    })

    if (deletionKey == null) {
      failDownload(dispatch, logPeriodId, MISSING_DELETION_KEY_ERROR)
      return false
    }

    dispatch(logPeriodDownloadSucceeded({ logPeriodId, deletionKey }) as Action)

    return true
  } catch (error) {
    failDownload(
      dispatch,
      logPeriodId,
      error instanceof Error ? error.message : String(error)
    )

    return false
  }
}

async function downloadAuditLogs(
  payload: DownloadAuditLogsPayload,
  dispatch: Dispatch
): Promise<void> {
  const { logPeriodSummaries, hostname, port, destination, robotName } = payload

  if (destination == null || destination === '') {
    failAllDownloads(
      dispatch,
      logPeriodSummaries,
      MISSING_USB_DESTINATION_ERROR
    )
    return
  }

  try {
    await access(destination, constants.W_OK)
  } catch {
    failAllDownloads(
      dispatch,
      logPeriodSummaries,
      UNWRITABLE_USB_DESTINATION_ERROR
    )
    return
  }

  const folderName =
    `${robotName}-audit-logs-${new Date().toISOString()}`.replace(
      /[^a-zA-Z0-9._-]/g,
      '_'
    )
  const outputDirectory = path.join(destination, folderName)
  await mkdir(outputDirectory, { recursive: true })

  const results = await Promise.all(
    logPeriodSummaries.map(logPeriodSummary =>
      downloadAuditLog(
        {
          logPeriodId: logPeriodSummary.id,
          fileName: `logperiod_${logPeriodSummary.startedAt.replaceAll(':', '_')}.zip`,
          hostname,
          port,
          destination: outputDirectory,
        },
        dispatch
      )
    )
  )

  if (results.every(succeeded => !succeeded)) {
    await rmdir(outputDirectory)
  }
}

function failDownload(
  dispatch: Dispatch,
  logPeriodId: string,
  error: string
): void {
  dispatch(logPeriodDownloadFailed({ logPeriodId, error }) as Action)
}

function failAllDownloads(
  dispatch: Dispatch,
  logPeriodSummaries: ReadonlyArray<{ id: string }>,
  error: string
): void {
  logPeriodSummaries.forEach(logPeriodSummary => {
    failDownload(dispatch, logPeriodSummary.id, error)
  })
}
