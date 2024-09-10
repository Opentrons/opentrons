import type { CreateCommand } from '@opentrons/shared-data'
import { chainMaintenanceCommandsRecursive } from '../../runs'
import * as React from 'react'
import { useCreateMaintenanceCommandMutation } from '@opentrons/react-api-client'

export function useChainMaintenanceCommands(): {
  chainRunCommands: (
    maintenanceRunId: string,
    commands: CreateCommand[],
    continuePastCommandFailure: boolean
  ) => ReturnType<typeof chainMaintenanceCommandsRecursive>
  isCommandMutationLoading: boolean
} {
  const [isLoading, setIsLoading] = React.useState(false)
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
