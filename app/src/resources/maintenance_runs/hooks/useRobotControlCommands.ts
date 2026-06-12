import { useCallback, useEffect, useRef, useState } from 'react'

import { useDeleteMaintenanceRunMutation } from '@opentrons/react-api-client'

import { useMaintenanceRunDocumentation } from '/app/local-resources/access-control/useMaintenanceRunDocumentation'

import { useCreateTargetedMaintenanceRunMutation } from '../../runs'
import { useChainMaintenanceCommands } from './useChainMaintenanceCommands'

import type { MaintenanceRun, Mount } from '@opentrons/api-client'
import type { DocumentedAction } from '@opentrons/react-api-client'
import type { CreateCommand } from '@opentrons/shared-data'

interface PendingExecution {
  resolve: (value: MaintenanceRun) => void
  reject: (reason?: unknown) => void
}

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
  runStartedAction: DocumentedAction
  runEndedAction: DocumentedAction
}
// Issue commands to the robot, creating an on-the-fly maintenance run for the duration of the issued commands, loading
// the relevant pipette if necessary. Commands are then executed, and regardless of the success status of those commands,
// the maintenance run is subsequently deleted.
export function useRobotControlCommands({
  pipetteInfo,
  commands,
  continuePastCommandFailure,
  onSettled,
  runStartedAction,
  runEndedAction,
}: UseRobotControlCommandsProps): UseRobotControlCommandsResult {
  const [isExecuting, setIsExecuting] = useState(false)
  const pendingExecutionRef = useRef<PendingExecution | null>(null)

  const handleDocumentationCancel = useCallback((): void => {
    if (pendingExecutionRef.current != null) {
      const { reject } = pendingExecutionRef.current
      pendingExecutionRef.current = null
      reject(new Error('Documentation cancelled'))
    }
    setIsExecuting(false)
  }, [])

  const {
    commandDocState,
    deletionDocState,
    actionsToDocument,
    addActionToDocument,
    isLoading: isDocumentationLoading,
  } = useMaintenanceRunDocumentation(
    runStartedAction,
    handleDocumentationCancel
  )

  const { chainRunCommands } = useChainMaintenanceCommands(
    commandDocState,
    actionsToDocument,
    addActionToDocument
  )
  const { mutateAsync: deleteMaintenanceRun } = useDeleteMaintenanceRunMutation(
    deletionDocState,
    [...actionsToDocument, runEndedAction]
  )

  const { createTargetedMaintenanceRun } =
    useCreateTargetedMaintenanceRunMutation(
      commandDocState,
      [runStartedAction],
      {
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
                console.error(
                  'Failed to delete maintenance run:',
                  error.message
                )
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
      }
    )

  // If documentation state is loading, we queue the execution, and run it in the useEffect when the documentation is ready.
  // If documentation state is not loading, we can execute the commands immediately.
  useEffect(() => {
    if (isDocumentationLoading || pendingExecutionRef.current == null) {
      return
    }

    const { resolve, reject } = pendingExecutionRef.current
    pendingExecutionRef.current = null

    void createTargetedMaintenanceRun({}).then(resolve).catch(reject)
  }, [createTargetedMaintenanceRun, isDocumentationLoading])

  const executeCommands = (): Promise<MaintenanceRun> => {
    setIsExecuting(true)

    if (isDocumentationLoading) {
      return new Promise((resolve, reject) => {
        pendingExecutionRef.current = { resolve, reject }
      })
    }

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
