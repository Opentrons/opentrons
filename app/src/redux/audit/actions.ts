import { CHANGE_AUDIT_LOG_DIRECTORY, DOWNLOAD_AUDIT_LOG } from './constants'

import type {
  ChangeAuditLogDirectoryAction,
  DownloadAuditLogAction,
  DownloadAuditLogPayload,
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
