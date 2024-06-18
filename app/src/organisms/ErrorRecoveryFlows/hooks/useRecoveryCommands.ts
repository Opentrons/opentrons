import * as React from 'react'
import head from 'lodash/head'

import {
  useResumeRunFromRecoveryMutation,
  useStopRunMutation,
} from '@opentrons/react-api-client'

import { useChainRunCommands } from '../../../resources/runs'
import { RECOVERY_MAP } from '../constants'

import type { CreateCommand, LoadedLabware } from '@opentrons/shared-data'
import type { CommandData } from '@opentrons/api-client'
import type { WellGroup } from '@opentrons/components'
import type { FailedCommand } from '../types'
import type { UseFailedLabwareUtilsResult } from './useFailedLabwareUtils'
import type { UseRouteUpdateActionsResult } from './useRouteUpdateActions'

interface UseRecoveryCommandsParams {
  runId: string
  failedCommand: FailedCommand | null
  failedLabwareUtils: UseFailedLabwareUtilsResult
  routeUpdateActions: UseRouteUpdateActionsResult
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
  /* A non-terminal recovery command */
  pickUpTips: () => Promise<CommandData[]>
}
// Returns commands with a "fixit" intent. Commands may or may not terminate Error Recovery. See each command docstring for details.
export function useRecoveryCommands({
  runId,
  failedCommand,
  failedLabwareUtils,
  routeUpdateActions,
}: UseRecoveryCommandsParams): UseRecoveryCommandsResult {
  const { proceedToRouteAndStep } = routeUpdateActions
  const { chainRunCommands } = useChainRunCommands(runId, failedCommand?.id)
  const { resumeRunFromRecovery } = useResumeRunFromRecoveryMutation()
  const { stopRun } = useStopRunMutation()

  const chainRunRecoveryCommands = React.useCallback(
    (
      commands: CreateCommand[],
      continuePastFailure: boolean = false
    ): Promise<CommandData[]> =>
      chainRunCommands(commands, continuePastFailure).catch(e => {
        // the catch never occurs if continuePastCommandFailure is "true"
        void proceedToRouteAndStep(RECOVERY_MAP.ERROR_WHILE_RECOVERING.ROUTE)
        return Promise.reject(new Error(`Could not execute command: ${e}`))
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

  // Pick up the user-selected tips
  // TODO(jh, 06-14-24): Do not ignore pickUpTip errors once Pipettes can support tip pick up.
  const pickUpTips = React.useCallback((): Promise<CommandData[]> => {
    const { selectedTipLocations, pickUpTipLabware } = failedLabwareUtils

    const pickUpTipCmd = buildPickUpTips(
      selectedTipLocations,
      failedCommand,
      pickUpTipLabware
    )

    if (pickUpTipCmd == null) {
      return Promise.reject(
        new Error('Placeholder error: Invalid use of pickUpTips command')
      )
    } else {
      return chainRunRecoveryCommands([pickUpTipCmd], true)
    }
  }, [chainRunRecoveryCommands, failedCommand, failedLabwareUtils])

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
    pickUpTips,
  }
}

export const HOME_PIPETTE_Z_AXES: CreateCommand = {
  commandType: 'home',
  params: { axes: ['leftZ', 'rightZ'] },
  intent: 'fixit',
}

export const buildPickUpTips = (
  tipGroup: WellGroup | null,
  failedCommand: FailedCommand | null,
  labware: LoadedLabware | null
): CreateCommand | null => {
  if (
    failedCommand == null ||
    labware === null ||
    tipGroup == null ||
    !('pipetteId' in failedCommand.params)
  ) {
    return null
  } else {
    const wellName = head(Object.keys(tipGroup)) as string

    return {
      commandType: 'pickUpTip',
      params: {
        labwareId: labware.id,
        pipetteId: failedCommand.params.pipetteId,
        wellName,
      },
    }
  }
}
