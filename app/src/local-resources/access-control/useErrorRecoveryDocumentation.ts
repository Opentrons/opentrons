import { useActionsToDocumentList } from './useActionsToDocumentList'
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
  const [actionsToDocument, addActionToDocument] = useActionsToDocumentList()
  const documentationState = useDocumentationState()

  return { documentationState, actionsToDocument, addActionToDocument }
}
