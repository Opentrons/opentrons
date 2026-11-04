import { useCreateMaintenanceCommandMutation } from '@opentrons/react-api-client'

import { useChainMaintenanceCommands } from '/app/resources/maintenance_runs'
import {
  useChainRunCommands,
  useCreateRunCommandMutation,
} from '/app/resources/runs'

import type { CommandData } from '@opentrons/api-client'
import type {
  DocumentationState,
  DocumentedAction,
} from '@opentrons/react-api-client'
import type { CreateCommand } from '@opentrons/shared-data'
import type { SetRobotErrorDetailsParams, UseDTWithTypeParams } from '.'
import type { FixitCommandTypeUtils } from '../types'

export interface RunCommandByCommandTypeParams {
  command: CreateCommand
  timeout?: number
  waitUntilComplete?: boolean
}

interface UseDropTipCreateCommandsParams {
  issuedCommandsType: UseDTWithTypeParams['issuedCommandsType']
  activeMaintenanceRunId: string | null
  fixitCommandTypeUtils?: FixitCommandTypeUtils
  setErrorDetails: (errorDetails: SetRobotErrorDetailsParams) => void
  commandDocState: DocumentationState
  actionsToDocument: DocumentedAction[]
  addActionToDocument: (action: DocumentedAction) => void
}

export interface UseDropTipCreateCommandsResult {
  chainRunCommands: (
    commands: CreateCommand[],
    continuePastFailure: boolean
  ) => Promise<CommandData[]>
  runCommand: (params: RunCommandByCommandTypeParams) => Promise<CommandData>
  isCommandInProgress: boolean
}

// Wraps command issuance functionality based on whether commands are "setup" or "fixit".
export function useDropTipCreateCommands({
  issuedCommandsType,
  fixitCommandTypeUtils,
  activeMaintenanceRunId,
  setErrorDetails,
  commandDocState,
  actionsToDocument,
  addActionToDocument,
}: UseDropTipCreateCommandsParams): UseDropTipCreateCommandsResult {
  const { failedCommandId, runId } = fixitCommandTypeUtils ?? {
    failedCommand: null,
    runId: '',
  }

  const {
    chainRunCommands: chainRunSetupCommands,
    isCommandMutationLoading: isSetupCommandLoading,
  } = useChainMaintenanceCommands(
    commandDocState,
    actionsToDocument,
    addActionToDocument
  )

  const {
    chainRunCommands: chainRunFixitCommands,
    isCommandMutationLoading: isFixitCommandLoading,
  } = useChainRunCommands(
    runId,
    commandDocState,
    actionsToDocument,
    addActionToDocument,
    failedCommandId
  )

  const { createMaintenanceCommand } = useCreateMaintenanceCommandMutation(
    commandDocState,
    actionsToDocument,
    addActionToDocument
  )

  const { createRunCommand } = useCreateRunCommandMutation(
    runId,
    commandDocState,
    actionsToDocument,
    addActionToDocument,
    failedCommandId
  )

  const chainRunCommandsByCommandType = (
    commands: CreateCommand[],
    continuePastFailure: boolean
  ): Promise<CommandData[]> => {
    return new Promise((resolve, reject) => {
      if (issuedCommandsType === 'fixit') {
        void chainRunFixitCommands(commands, continuePastFailure)
          .then(resolve)
          .catch(reject)
      } else {
        if (activeMaintenanceRunId !== null) {
          return chainRunSetupCommands(
            activeMaintenanceRunId,
            commands,
            continuePastFailure
          )
            .then(resolve)
            .catch(reject)
        } else {
          setErrorDetails({ message: 'No active maintenance run found.' })
          reject(new Error('No active maintenance run found.'))
        }
      }
    })
  }

  const runCommandByCommandType = (
    params: RunCommandByCommandTypeParams
  ): Promise<CommandData> => {
    return new Promise((resolve, reject) => {
      if (issuedCommandsType === 'fixit') {
        return createRunCommand({
          failedCommandId,
          ...params,
        })
          .then(resolve)
          .catch(reject)
      } else {
        if (activeMaintenanceRunId !== null) {
          return createMaintenanceCommand({
            maintenanceRunId: activeMaintenanceRunId,
            ...params,
          })
            .then(resolve)
            .catch(reject)
        } else {
          setErrorDetails({ message: 'No active maintenance run found.' })
          reject(new Error('No active maintenance run found.'))
        }
      }
    })
  }

  const isCommandInProgressByType =
    issuedCommandsType === 'fixit'
      ? isFixitCommandLoading
      : isSetupCommandLoading

  return {
    chainRunCommands: chainRunCommandsByCommandType,
    runCommand: runCommandByCommandType,
    isCommandInProgress: isCommandInProgressByType,
  }
}
