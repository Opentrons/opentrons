import { useCallback, useState } from 'react'

import { useDocumentationState } from './useDocumentationState'

import type {
  DocumentationState,
  DocumentedAction,
} from '@opentrons/react-api-client'

export const useErrorRecoveryDocumentation = (): {
  documentationState: DocumentationState
  actionsToDocument: DocumentedAction[]
  addActionToDocument: (action: DocumentedAction) => void
} => {
  const [actionsToDocument, setActionsToDocument] = useState<
    DocumentedAction[]
  >(['launching_error_recovery'])
  const addActionToDocument = useCallback((action: DocumentedAction) => {
    setActionsToDocument(prev => [...prev, action])
  }, [])

  const documentationState = useDocumentationState()

  return { documentationState, actionsToDocument, addActionToDocument }
}
