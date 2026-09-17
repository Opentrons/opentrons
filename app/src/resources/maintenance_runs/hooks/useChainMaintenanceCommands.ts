import { useState } from 'react'

import {
  isDocumentedMutationError,
  useCreateMaintenanceCommandMutation,
} from '@opentrons/react-api-client'

import { chainMaintenanceCommandsRecursive } from '../../runs'

import type { CommandData } from '@opentrons/api-client'
import type {
  DocumentationState,
  DocumentedAction,
} from '@opentrons/react-api-client'
import type { CreateCommand } from '@opentrons/shared-data'

export function useChainMaintenanceCommands(
  documentationState: DocumentationState,
  actionsToDocument: DocumentedAction[],
  addActionToDocument: (action: DocumentedAction) => void
): {
  chainRunCommands: (
    maintenanceRunId: string,
    commands: CreateCommand[],
    continuePastCommandFailure: boolean
  ) => ReturnType<typeof chainMaintenanceCommandsRecursive>
  isCommandMutationLoading: boolean
} {
  const [isLoading, setIsLoading] = useState(false)
  const { createMaintenanceCommand } = useCreateMaintenanceCommandMutation(
    documentationState,
    actionsToDocument,
    addActionToDocument
  )
  return {
    chainRunCommands: (
      maintenanceRunId,
      commands: CreateCommand[],
      continuePastCommandFailure: boolean
    ) =>
      chainMaintenanceCommandsRecursive(
        maintenanceRunId,
        commands,
        createMaintenanceCommand,
        continuePastCommandFailure,
        setIsLoading
      ).catch(error => {
        if (isDocumentedMutationError(error)) {
          return new Promise<CommandData[]>(() => {})
        }
        return Promise.reject(error)
      }),
    isCommandMutationLoading: isLoading,
  }
}
