import { useState } from 'react'

import { useCreateMaintenanceCommandMutation } from '@opentrons/react-api-client'

import { chainMaintenanceCommandsRecursive } from '../../runs'

import type { DocumentationState } from '@opentrons/react-api-client'
import type { CreateCommand } from '@opentrons/shared-data'

export function useChainMaintenanceCommands(
  documentationState: DocumentationState
): {
  chainRunCommands: (
    maintenanceRunId: string,
    commands: CreateCommand[],
    continuePastCommandFailure: boolean
  ) => ReturnType<typeof chainMaintenanceCommandsRecursive>
  isCommandMutationLoading: boolean
} {
  const [isLoading, setIsLoading] = useState(false)
  const { createMaintenanceCommand } =
    useCreateMaintenanceCommandMutation(documentationState)
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
      ),
    isCommandMutationLoading: isLoading,
  }
}
