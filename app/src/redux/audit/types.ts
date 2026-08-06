import type { HostConfig, LogPeriodSummary } from '@opentrons/api-client'
import type {
  CHANGE_AUDIT_LOG_DIRECTORY,
  DOWNLOAD_AUDIT_LOG,
  DOWNLOAD_AUDIT_LOGS,
} from './constants'
import type { AuditSliceAction } from './slice'

export interface ChangeAuditLogDirectoryAction {
  type: typeof CHANGE_AUDIT_LOG_DIRECTORY
  meta: { shell: true }
}

export interface DownloadAuditLogPayload {
  logPeriodId: string
  fileName: string
  host: HostConfig
  destination?: string
}

export interface DownloadAuditLogsPayload {
  logPeriodSummaries: LogPeriodSummary[]
  host: HostConfig
  robotName: string
  destination?: string
}

export interface DownloadAuditLogAction {
  type: typeof DOWNLOAD_AUDIT_LOG
  payload: DownloadAuditLogPayload
  meta: { shell: true }
}

export interface DownloadAuditLogsAction {
  type: typeof DOWNLOAD_AUDIT_LOGS
  payload: DownloadAuditLogsPayload
  meta: { shell: true }
}

export type AuditAction =
  | AuditSliceAction
  | ChangeAuditLogDirectoryAction
  | DownloadAuditLogAction
  | DownloadAuditLogsAction
