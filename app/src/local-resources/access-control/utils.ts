import type { AxiosError } from 'axios'
import type { AuthUserAccountType } from '@opentrons/api-client'
import type {
  DocumentationReport,
  DocumentationState,
} from '@opentrons/react-api-client'

const PROTOCOLS_WRITE_SCOPE = 'protocols.write'

const MAX_ERROR_DETAIL_LENGTH = 255

const RUN_SIGNOFF_REQUIRED = 'RunSignoffRequired'

/** Admin and service accounts share the same privileged robot permissions. */
export function isAdminEquivalentAccountType(
  accountType: AuthUserAccountType | undefined
): boolean {
  return accountType === 'admin' || accountType === 'service'
}

export function isDocumentationReportValid(
  docreport: DocumentationReport,
  minLengthOfReasonForInteraction: number
): boolean {
  return (
    docreport != null && docreport.length >= minLengthOfReasonForInteraction
  )
}

export function isDocumentationProvided(state: DocumentationState): boolean {
  if (state.isLoading) {
    return false
  }
  if (!state.accessControlEnabled) {
    return true
  }
  if (!state.reasonForInteractionRequired) {
    return true
  }
  return state.docreport != null && state.docreport.length > 0
}

export const ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE: DocumentationState = {
  isLoading: false,
  accessControlEnabled: false,
}

export function isForbiddenError(error: unknown): error is AxiosError {
  return isAxiosError(error) && error.response?.status === 403
}

export function isRunSignoffRequiredError(error: unknown): boolean {
  if (!isAxiosError(error)) {
    return false
  }
  const errorId = (
    error.response?.data as { errors?: Array<{ id?: unknown }> } | undefined
  )?.errors?.[0]?.id
  return errorId === RUN_SIGNOFF_REQUIRED
}

export function getAuditLogDeleteErrorMessage(
  error: unknown,
  permissionErrorMessage: string,
  generalErrorMessage: string
): string {
  if (isForbiddenError(error)) {
    return permissionErrorMessage
  }
  return generalErrorMessage
}

export function isProtocolWritePermissionError(error: unknown): boolean {
  if (!isForbiddenError(error)) {
    return false
  }
  const requiredScopes = (
    error.response?.data as { requiredScopes?: unknown } | undefined
  )?.requiredScopes
  return (
    Array.isArray(requiredScopes) &&
    requiredScopes.includes(PROTOCOLS_WRITE_SCOPE)
  )
}

export function getProtocolOrRunCreationErrorMessage(
  error: unknown,
  generalErrorMessage: string,
  permissionErrorMessage: string
): string {
  if (isProtocolWritePermissionError(error)) {
    return permissionErrorMessage
  }
  if (isAxiosError(error)) {
    const detail = (
      error.response?.data as
        { errors?: Array<{ detail?: unknown }> } | undefined
    )?.errors?.[0]?.detail
    if (typeof detail === 'string' && detail.length > 0) {
      return detail.length > MAX_ERROR_DETAIL_LENGTH
        ? generalErrorMessage
        : detail
    }
  }
  return generalErrorMessage
}

function isAxiosError(error: unknown): error is AxiosError {
  return (
    typeof error === 'object' &&
    error != null &&
    'isAxiosError' in error &&
    error.isAxiosError === true
  )
}
