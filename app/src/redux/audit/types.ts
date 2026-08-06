import type { HostConfig } from '@opentrons/api-client'
import type {
  CHANGE_AUDIT_LOG_DIRECTORY,
  DOWNLOAD_AUDIT_LOG,
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
}

export interface DownloadAuditLogAction {
  type: typeof DOWNLOAD_AUDIT_LOG
  payload: DownloadAuditLogPayload
  meta: { shell: true }
}

export type AuditAction =
  AuditSliceAction | ChangeAuditLogDirectoryAction | DownloadAuditLogAction
