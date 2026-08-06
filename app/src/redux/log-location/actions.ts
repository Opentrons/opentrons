import { CHANGE_AUDIT_LOG_DIRECTORY } from './constants'

import type { ChangeAuditLogDirectoryAction } from './types'

export const changeAuditLogDirectory = (): ChangeAuditLogDirectoryAction => ({
  type: CHANGE_AUDIT_LOG_DIRECTORY,
  meta: { shell: true },
})
