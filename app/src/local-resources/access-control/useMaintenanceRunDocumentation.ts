import { useGuardedAction } from './useGuardedAction'
import { usePromptForInteractionReason } from './usePromptForInteractionReason'

import type { DocumentationState } from '@opentrons/react-api-client'

/**
 * Generates documentation states for maintenane run flows.
 * Prompts immediately for docstate to be passed to creation and maintenance run commands.
 * Generates docstate to prompt for documentation when deleting the maintenance run.
 *
 * @returns commandDocState: DocumentationState to be passed to the creation hook and the maintenance run commands.
 * @returns deletionDocState: DocumentationState to be passed to the deletion hook.
 */
export const useMaintenanceRunDocumentation = (
  initialDocstate?: DocumentationState
): {
  commandDocState: DocumentationState
  deletionDocState: DocumentationState
} => {
  const commandDocState = usePromptForInteractionReason(initialDocstate)
  const deletionDocState = useGuardedAction()

  return { commandDocState, deletionDocState }
}
