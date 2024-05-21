import * as React from 'react'

import { useResumeRunFromRecoveryMutation } from '@opentrons/react-api-client'

import { useChainRunCommands } from '../../resources/runs'

import type { CreateCommand } from '@opentrons/shared-data'
import type { CommandData } from '@opentrons/api-client'
import type { FailedCommand } from './types'

interface UseRecoveryCommandsParams {
  runId: string
  failedCommand: FailedCommand | null
}
export interface UseRecoveryCommandsResult {
  resumeRun: () => void
  retryFailedCommand: () => Promise<CommandData[]>
  homePipetteZAxes: () => Promise<CommandData[]>
}
// Returns recovery command functions.
export function useRecoveryCommands({
  runId,
  failedCommand,
}: UseRecoveryCommandsParams): UseRecoveryCommandsResult {
  const { chainRunCommands } = useChainRunCommands(runId, failedCommand?.id)
  const { resumeRunFromRecovery } = useResumeRunFromRecoveryMutation()

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

  return {
    resumeRun,
    retryFailedCommand,
    homePipetteZAxes,
  }
}

export const HOME_PIPETTE_Z_AXES: CreateCommand = {
  commandType: 'home',
  params: { axes: ['leftZ', 'rightZ'] },
  intent: 'fixit',
}
