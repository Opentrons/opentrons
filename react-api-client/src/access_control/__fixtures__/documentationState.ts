import { vi } from 'vitest'

import type {
  DocumentationReport,
  DocumentationState,
  DocumentedAction,
} from '../types'

type AskForDocumentation = (
  actionsToDocument: DocumentedAction[],
  onCancel?: () => void,
  defaultDocReport?: DocumentationReport | null
) => Promise<DocumentationReport>

export const ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE: DocumentationState = {
  isLoading: false,
  accessControlEnabled: false,
}

export function createReasonNotRequiredDocumentationState(): DocumentationState {
  return {
    isLoading: false,
    accessControlEnabled: true,
    loginExpired: false,
    askForLogin: vi.fn(async () => {}),
    reasonForInteractionRequired: false,
  }
}

export function createReasonRequiredWithDocReport(
  docreport: DocumentationReport
): DocumentationState {
  return {
    isLoading: false,
    accessControlEnabled: true,
    loginExpired: false,
    askForLogin: vi.fn(async () => {}),
    reasonForInteractionRequired: true,
    docreport,
    askForDocumentation: vi.fn(),
  }
}

export function createReasonRequiredWithoutDocReport(
  askForDocumentation: AskForDocumentation
): DocumentationState {
  return {
    isLoading: false,
    accessControlEnabled: true,
    loginExpired: false,
    askForLogin: vi.fn(async () => {}),
    reasonForInteractionRequired: true,
    docreport: null,
    askForDocumentation,
  }
}
