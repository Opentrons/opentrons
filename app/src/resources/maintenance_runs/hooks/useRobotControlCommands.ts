import { useState } from 'react'

import { useDeleteMaintenanceRunMutation } from '@opentrons/react-api-client'

import { useChainMaintenanceCommands } from './useChainMaintenanceCommands'
import { useCreateTargetedMaintenanceRunMutation } from '../../runs'

import type { CreateCommand } from '@opentrons/shared-data'
import type { MaintenanceRun, Mount } from '@opentrons/api-client'

export interface PipetteDetails {
  mount: Mount
  pipetteId: string
  pipetteName?: string
}

export interface UseRobotControlCommandsResult {
  /* Creates the maintenance run, executes the commands utilizing the maintenance run context, then deletes the maintenance run. */
  executeCommands: () => Promise<MaintenanceRun>
  /**
   * Whether executeCommands is currently executing. This becomes "true" as the maintenance run is created and only
   * becomes "false" after the maintenance run is deleted.
   */
  isExecuting: boolean
}

export interface UseRobotControlCommandsProps {
  pipetteInfo: PipetteDetails | null
  commands: CreateCommand[]
  continuePastCommandFailure: boolean
  /* An onSettled callback executed after the deletion of the maintenance run. */
  onSettled?: () => void
}
// Issue commands to the robot, creating an on-the-fly maintenance run for the duration of the issued commands, loading
// the relevant pipette if necessary. Commands are then executed, and regardless of the success status of those commands,
// the maintenance run is subsequently deleted.
export function useRobotControlCommands({
  pipetteInfo,
  commands,
  continuePastCommandFailure,
  onSettled,
}: UseRobotControlCommandsProps): UseRobotControlCommandsResult {
  const [isExecuting, setIsExecuting] = useState(false)

  const { chainRunCommands } = useChainMaintenanceCommands()
  const {
    mutateAsync: deleteMaintenanceRun,
  } = useDeleteMaintenanceRunMutation()

  const {
    createTargetedMaintenanceRun,
  } = useCreateTargetedMaintenanceRunMutation({
    onSuccess: response => {
      const runId = response.data.id as string

      const loadPipetteIfSupplied = (): Promise<void> => {
        if (pipetteInfo !== null) {
          const loadPipetteCommand = buildLoadPipetteCommand(pipetteInfo)
          return chainRunCommands(runId, [loadPipetteCommand], false)
            .then(() => Promise.resolve())
            .catch((error: Error) => {
              console.error(error.message)
            })
        }
        return Promise.resolve()
      }

      // Execute the command(s)
      loadPipetteIfSupplied()
        .then(() =>
          chainRunCommands(runId, commands, continuePastCommandFailure)
        )
        .catch((error: Error) => {
          console.error(error.message)
        })
        .finally(() =>
          deleteMaintenanceRun(runId).catch((error: Error) => {
            console.error('Failed to delete maintenance run:', error.message)
          })
        )
        .finally(() => {
          onSettled?.()
          setIsExecuting(false)
        })
    },
    onError: (error: Error) => {
      console.error(error.message)
      setIsExecuting(false)
    },
  })

  const executeCommands = (): Promise<MaintenanceRun> => {
    setIsExecuting(true)
    return createTargetedMaintenanceRun({})
  }

  return { executeCommands, isExecuting }
}

const buildLoadPipetteCommand = (
  pipetteDetails: PipetteDetails
): CreateCommand => {
  return {
    commandType: 'loadPipette',
    params: {
      ...pipetteDetails,
      pipetteName: pipetteDetails.pipetteName ?? 'managedPipetteId',
    },
  }
}
