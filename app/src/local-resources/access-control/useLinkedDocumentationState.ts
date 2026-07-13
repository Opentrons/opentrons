import { useCallback, useState } from 'react'

import { useDocumentationState } from './useDocumentationState'

import type { HostConfig } from '@opentrons/api-client'
import type {
  DocumentationReport,
  DocumentationState,
  DocumentedAction,
} from '@opentrons/react-api-client'

export const useLinkedDocumentationState = (
  actionsToDocument: DocumentedAction[],
  robotName?: string | null,
  hostOverride?: HostConfig | null
): DocumentationState => {
  const [docreport, setDocreport] = useState<DocumentationReport>()

  const onPromptForDocumentation = useCallback(
    (docreport: DocumentationReport) => {
      if (docreport.length > 0) {
        setDocreport(docreport)
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

  return documentationState
}
