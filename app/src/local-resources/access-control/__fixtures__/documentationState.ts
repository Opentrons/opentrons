import { vi } from 'vitest'

import type {
  DocumentationReport,
  DocumentationState,
  DocumentedAction,
} from '@opentrons/react-api-client'

type AskForDocumentation = (
  actionsToDocument: DocumentedAction[],
  onCancel?: () => void,
  defaultDocReport?: DocumentationReport | null,
  username?: string
) => Promise<DocumentationReport>

type AccessControlEnabledState = Extract<
  DocumentationState,
  { accessControlEnabled: true }
>
type ReasonNotRequiredState = Extract<
  AccessControlEnabledState,
  { reasonForInteractionRequired: false }
>
type ReasonRequiredState = Extract<
  AccessControlEnabledState,
  { reasonForInteractionRequired: true }
>

export const ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE: DocumentationState = {
  isLoading: false,
  accessControlEnabled: false,
}

export function createReasonNotRequiredDocumentationState(): ReasonNotRequiredState {
  return {
    isLoading: false,
    accessControlEnabled: true,
    loginExpired: false,
    askForLogin: vi.fn(async () => ({ username: 'alice' })),
    reasonForInteractionRequired: false,
  }
}

export function createReasonRequiredWithDocReport(
  docreport: DocumentationReport
): ReasonRequiredState {
  return {
    isLoading: false,
    accessControlEnabled: true,
    loginExpired: false,
    askForLogin: vi.fn(async () => ({ username: 'alice' })),
    reasonForInteractionRequired: true,
    docreport,
    askForDocumentation: vi.fn(),
  }
}

export function createReasonRequiredWithoutDocReport(
  askForDocumentation: AskForDocumentation
): ReasonRequiredState {
  return {
    isLoading: false,
    accessControlEnabled: true,
    loginExpired: false,
    askForLogin: vi.fn(async () => ({ username: 'alice' })),
    reasonForInteractionRequired: true,
    docreport: null,
    askForDocumentation,
  }
}
