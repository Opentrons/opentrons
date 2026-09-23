import audit_log from '/app/assets/localization/en/audit_log.json'

import type { DocumentedAction } from '@opentrons/react-api-client'
import type {
  AttachingModuleAction,
  PipetteWizardFlowAction,
} from '@opentrons/react-api-client/src/accessControl/types'
import type { RunTimeCommand } from '@opentrons/shared-data'

/**
 * DocumentedAction provides a list of all possible actions that can be documented.
 * Audit_log.json maps those actions to strings to show in the UI
 * This file exists to throw compilation errors if audit_log.json is missing any keys
 */

type DocumentedActionStrings = Exclude<
  DocumentedAction,
  RunTimeCommand | AttachingModuleAction | PipetteWizardFlowAction
>

// compile time assertion that the audit_log keys match the DocumentedAction enum
audit_log satisfies Record<DocumentedActionStrings, string>
