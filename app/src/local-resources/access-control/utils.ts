import axios from 'axios'

import type {
  DocumentationReport,
  DocumentationState,
} from '@opentrons/react-api-client'

const PROTOCOLS_WRITE_SCOPE = 'protocols.write'

const MAX_ERROR_DETAIL_LENGTH = 255

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

export function isProtocolWritePermissionError(error: unknown): boolean {
  if (!axios.isAxiosError(error) || error.response?.status !== 403) {
    return false
  }
  const requiredScopes = (
    error.response.data as { requiredScopes?: unknown } | undefined
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
  if (axios.isAxiosError(error)) {
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
