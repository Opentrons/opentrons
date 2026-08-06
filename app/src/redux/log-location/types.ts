import type { CHANGE_AUDIT_LOG_DIRECTORY } from './constants'

export interface ChangeAuditLogDirectoryAction {
  type: typeof CHANGE_AUDIT_LOG_DIRECTORY
  meta: { shell: true }
}

export type LogLocationAction = ChangeAuditLogDirectoryAction
