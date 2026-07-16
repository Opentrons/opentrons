import { useCallback, useEffect, useRef, useState } from 'react'

import { useDocumentationState } from './useDocumentationState'

import type { HostConfig } from '@opentrons/api-client'
import type {
  DocumentationReport,
  DocumentationState,
  DocumentedAction,
} from '@opentrons/react-api-client'

export interface LinkedDocumentationStateResult {
  documentationState: DocumentationState
  clearDocreport: () => void
}

/**
 * Documentation state shared across multiple mutations.
 *
 * When one mutation prompts, the report is written onto the current state
 * object immediately (and into React state) so sibling mutations that still
 * hold a ref to this object see the report before the next render.
 *
 * @param resetKey - when this value changes, the stored report is cleared
 *   (e.g. a new failed command / recovery session)
 */
export const useLinkedDocumentationState = (
  actionsToDocument: DocumentedAction[],
  robotName?: string | null,
  hostOverride?: HostConfig | null,
  resetKey?: string | null
): LinkedDocumentationStateResult => {
  const [docreport, setDocreport] = useState<DocumentationReport>()
  const documentationStateRef = useRef<DocumentationState>({ isLoading: true })

  const clearDocreport = useCallback(() => {
    const current = documentationStateRef.current
    if (
      !current.isLoading &&
      current.accessControlEnabled &&
      current.reasonForInteractionRequired
    ) {
      current.docreport = null
    }
    setDocreport(undefined)
  }, [])

  useEffect(() => {
    return () => {
      clearDocreport()
    }
  }, [clearDocreport, resetKey])

  const onPromptForDocumentation = useCallback(
    (report: DocumentationReport) => {
      if (report.length > 0) {
        const current = documentationStateRef.current
        if (
          !current.isLoading &&
          current.accessControlEnabled &&
          current.reasonForInteractionRequired
        ) {
          current.docreport = report
        }
        setDocreport(report)
      }
    },
    []
  )

  const documentationState = useDocumentationState(
    docreport,
    robotName,
    hostOverride,
    onPromptForDocumentation,
    actionsToDocument
  )

  documentationStateRef.current = documentationState

  return { documentationState, clearDocreport }
}
