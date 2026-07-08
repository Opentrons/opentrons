import { useCallback, useState } from 'react'

import { useDocumentationState } from './useDocumentationState'
import { usePromptForDocumentation } from './usePromptForDocumentation'

import type {
  DocumentationState,
  DocumentedAction,
} from '@opentrons/react-api-client'

/**
 * Generates documentation states for maintenane run flows.
 * Prompts immediately for docstate to be passed to creation and maintenance run commands.
 * Generates docstate to prompt for documentation when deleting the maintenance run.
 *
 * @param maintenanceRunName: The name of the maintenance run, to be displayed in the initial documentation modal.
 * @param onCancelStart: Optional callback when the user backs out of the initial documentation modal.
 * @param initialDocstate: An optional documentation state - to be used in flows like attaching where prompting needs to occur before the first mutation.
 * @param promptEnabled: When false, defer the command documentation prompt until set to true. Defaults to true.
 *
 * @returns commandDocState: DocumentationState to be passed to the creation hook and the maintenance run commands.
 * @returns deletionDocState: DocumentationState to be passed to the deletion hook.
 * @returns actionsToDocument: The list of actions taken during the maintenance run, to be passed to the deletion hook.
 * @returns addActionToDocument: A function to add an action to the list of actions to document, to be used by the maintenance run commands to track the actions taken.
 */
export const useMaintenanceRunDocumentation = (
  maintenanceRunName: DocumentedAction,
  onCancelStart?: () => void,
  initialDocstate?: DocumentationState,
  promptEnabled: boolean = true
): {
  commandDocState: DocumentationState
  deletionDocState: DocumentationState
  actionsToDocument: DocumentedAction[]
  addActionToDocument: (action: DocumentedAction) => void
  isLoading: boolean
} => {
  const [actionsToDocument, setActionsToDocument] = useState<
    DocumentedAction[]
  >([maintenanceRunName])
  const commandDocState = usePromptForDocumentation(
    [maintenanceRunName],
    onCancelStart,
    initialDocstate,
    promptEnabled
  )
  const deletionDocState = useDocumentationState()

  const addActionToDocument = useCallback((action: DocumentedAction) => {
    setActionsToDocument(prev => [...prev, action])
  }, [])

  return {
    isLoading: commandDocState.isLoading || deletionDocState.isLoading,
    commandDocState,
    deletionDocState,
    actionsToDocument,
    addActionToDocument,
  }
}
