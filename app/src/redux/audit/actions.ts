import {
  CHANGE_AUDIT_LOG_DIRECTORY,
  DOWNLOAD_AUDIT_LOG,
  DOWNLOAD_AUDIT_LOGS,
} from './constants'

import type {
  ChangeAuditLogDirectoryAction,
  DownloadAuditLogAction,
  DownloadAuditLogPayload,
  DownloadAuditLogsAction,
  DownloadAuditLogsPayload,
} from './types'

export const changeAuditLogDirectory = (): ChangeAuditLogDirectoryAction => ({
  type: CHANGE_AUDIT_LOG_DIRECTORY,
  meta: { shell: true },
})

export const downloadAuditLog = (
  payload: DownloadAuditLogPayload
): DownloadAuditLogAction => ({
  type: DOWNLOAD_AUDIT_LOG,
  payload,
  meta: { shell: true },
})

export const downloadAuditLogs = (
  payload: DownloadAuditLogsPayload
): DownloadAuditLogsAction => ({
  type: DOWNLOAD_AUDIT_LOGS,
  payload,
  meta: { shell: true },
})
