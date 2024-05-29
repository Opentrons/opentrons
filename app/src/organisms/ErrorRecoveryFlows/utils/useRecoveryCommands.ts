import * as React from 'react'

import {
  useResumeRunFromRecoveryMutation,
  useStopRunMutation,
} from '@opentrons/react-api-client'

import { useChainRunCommands } from '../../../resources/runs'

import type { CreateCommand } from '@opentrons/shared-data'
import type { CommandData } from '@opentrons/api-client'
import type { FailedCommand } from '../types'

interface UseRecoveryCommandsParams {
  runId: string
  failedCommand: FailedCommand | null
}
export interface UseRecoveryCommandsResult {
  /* A terminal recovery command that causes ER to exit as the run status becomes "running" */
  resumeRun: () => void
  /* A terminal recovery command that causes ER to exit as the run status becomes "stop-requested" */
  cancelRun: () => void
  /* A non-terminal recovery command */
  retryFailedCommand: () => Promise<CommandData[]>
  /* A non-terminal recovery command */
  homePipetteZAxes: () => Promise<CommandData[]>
}
// Returns commands with a "fixit" intent. Commands may or may not terminate Error Recovery. See each command docstring for details.
export function useRecoveryCommands({
  runId,
  failedCommand,
}: UseRecoveryCommandsParams): UseRecoveryCommandsResult {
  const { chainRunCommands } = useChainRunCommands(runId, failedCommand?.id)
  const { resumeRunFromRecovery } = useResumeRunFromRecoveryMutation()
  const { stopRun } = useStopRunMutation()

  const chainRunRecoveryCommands = React.useCallback(
    (
      commands: CreateCommand[],
      continuePastFailure: boolean = true
    ): Promise<CommandData[]> =>
      chainRunCommands(commands, continuePastFailure).catch(e => {
        // the catch never occurs if continuePastCommandFailure is "true"
        return Promise.reject(new Error(`placeholder error ${e}`))
      }),
    [chainRunCommands]
  )

  const retryFailedCommand = React.useCallback((): Promise<CommandData[]> => {
    const { commandType, params } = failedCommand as FailedCommand // Null case is handled before command could be issued.

    return chainRunRecoveryCommands([
      { commandType, params },
    ] as CreateCommand[]) // the created command is the same command that failed
  }, [chainRunRecoveryCommands, failedCommand])

  // Homes the Z-axis of all attached pipettes.
  const homePipetteZAxes = React.useCallback((): Promise<CommandData[]> => {
    return chainRunRecoveryCommands([HOME_PIPETTE_Z_AXES])
  }, [chainRunRecoveryCommands])

  const resumeRun = React.useCallback((): void => {
    resumeRunFromRecovery(runId)
  }, [runId, resumeRunFromRecovery])

  const cancelRun = React.useCallback((): void => {
    stopRun(runId)
  }, [runId])

  return {
    resumeRun,
    cancelRun,
    retryFailedCommand,
    homePipetteZAxes,
  }
}

export const HOME_PIPETTE_Z_AXES: CreateCommand = {
  commandType: 'home',
  params: { axes: ['leftZ', 'rightZ'] },
  intent: 'fixit',
}
