import audit_log from '/app/assets/localization/en/audit_log.json'

import type { DocumentedAction } from '@opentrons/react-api-client'
import type {
  AttachingModule,
  PipetteWizardFlowName,
} from '@opentrons/react-api-client/src/access_control/types'
import type { RunTimeCommand } from '@opentrons/shared-data'

/**
 * DocumentedAction provides a list of all possible actions that can be documented.
 * Audit_log.json maps those actions to strings to show in the UI
 * This file exists to throw compilation errors if audit_log.json is missing any keys
 */

type DocumentedActionStrings = Exclude<
  DocumentedAction,
  RunTimeCommand | PipetteWizardFlowName | AttachingModule
>
// compile time assertion that the audit_log keys match the DocumentedAction enum
audit_log satisfies Record<DocumentedActionStrings, string>

type AuditLogKey = keyof typeof audit_log

// asserts that there are no keys missing from the DocumentedAction enum
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _noExtraKeys: AuditLogKey extends DocumentedAction ? true : never = true
