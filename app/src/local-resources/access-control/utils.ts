import type {
  DocumentationReport,
  DocumentationState,
} from '@opentrons/react-api-client'

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
