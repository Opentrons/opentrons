import { useCreateMaintenanceCommandMutation } from '@opentrons/react-api-client'
import type { CreateCommand } from '@opentrons/shared-data'
import { useState } from 'react'
import { chainMaintenanceCommandsRecursive } from '../../runs'

export function useChainMaintenanceCommands(): {
  chainRunCommands: (
    maintenanceRunId: string,
    commands: CreateCommand[],
    continuePastCommandFailure: boolean
  ) => ReturnType<typeof chainMaintenanceCommandsRecursive>
  isCommandMutationLoading: boolean
} {
  const [isLoading, setIsLoading] = useState(false)
  const { createMaintenanceCommand } = useCreateMaintenanceCommandMutation()
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
