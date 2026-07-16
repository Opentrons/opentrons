import { useCallback, useState } from 'react'
import head from 'lodash/head'

import {
  isDocumentedMutationError,
  useErrorRecoveryPolicy,
  useResumeRunFromRecoveryAssumingFalsePositiveMutation,
  useResumeRunFromRecoveryMutation,
  useStopRunMutation,
} from '@opentrons/react-api-client'
import { WELL_ORIGIN_TOP } from '@opentrons/shared-data'

import { useErrorRecoveryDocumentation } from '/app/local-resources/access-control/useErrorRecoveryDocumentation'
import { getErrorKind } from '/app/organisms/ErrorRecoveryFlows/utils'
import {
  useChainRunCommands,
  useUpdateRecoveryPolicyWithStrategy,
} from '/app/resources/runs'

import { DEFINED_ERROR_TYPES, ERROR_KINDS, RECOVERY_MAP } from '../constants'

import type { CommandData, IfMatchType, RunAction } from '@opentrons/api-client'
import type { WellGroup } from '@opentrons/components'
import type {
  AspDispWhileTrackingParams,
  AspirateInPlaceRunTimeCommand,
  AspirateWhileTrackingRunTimeCommand,
  BlowoutInPlaceRunTimeCommand,
  CreateCommand,
  DispenseInPlaceRunTimeCommand,
  DispenseWhileTrackingRunTimeCommand,
  DropTipInPlaceRunTimeCommand,
  FlexStackerRetrieveRunTimeCommand,
  FlexStackerStoreRunTimeCommand,
  LiquidProbeCreateCommand,
  LoadedLabware,
  MoveLabwareParams,
  MoveToCoordinatesCreateCommand,
  PrepareToAspirateRunTimeCommand,
  RunCommandError,
  RunCommandErrorOverpressure,
  RunCommandErrorTipPhysicallyAttached,
  Vector3D,
  WellLocation,
} from '@opentrons/shared-data'
import type { UseRecoveryAnalyticsResult } from '/app/redux-resources/analytics'
import type { UpdateErrorRecoveryPolicyWithStrategy } from '/app/resources/runs'
import type { ErrorRecoveryFlowsProps } from '..'
import type { FailedCommand, RecoveryRoute, RouteStep } from '../types'
import type { UseFailedLabwareUtilsResult } from './useFailedLabwareUtils'
import type { CurrentRecoveryOptionUtils } from './useRecoveryRouting'
import type { RecoveryToasts } from './useRecoveryToasts'
import type { FailedCommandBySource } from './useRetainedFailedCommandBySource'
import type { UseRouteUpdateActionsResult } from './useRouteUpdateActions'

// TODO(jh, 01-14-26): This value exists as a python-exclusive shared-data constant.
// We should move this constant and the existing shared-data constant to a JSON.
const LIQUID_PROBE_START_OFFSET_FROM_WELL_TOP: Vector3D = { x: 0, y: 0, z: 2 }

interface UseRecoveryCommandsParams {
  runId: string
  failedCommand: FailedCommandBySource | null
  unvalidatedFailedCommand: ErrorRecoveryFlowsProps['unvalidatedFailedCommand']
  failedLabwareUtils: UseFailedLabwareUtilsResult
  routeUpdateActions: UseRouteUpdateActionsResult
  recoveryToastUtils: RecoveryToasts
  analytics: UseRecoveryAnalyticsResult<RecoveryRoute, RouteStep>
  selectedRecoveryOption: CurrentRecoveryOptionUtils['selectedRecoveryOption']
}
export interface UseRecoveryCommandsResult {
  /* A terminal recovery command that causes ER to exit as the run status becomes "running" */
  resumeRun: () => void
  /* A terminal recovery command that causes ER to exit as the run status becomes "stop-requested" */
  cancelRun: () => void
  /* A terminal recovery command, that causes ER to exit as the run status becomes "running" */
  skipFailedCommand: () => void
  /* A non-terminal recovery command. Ignore this errorKind for the rest of this run.
   * The server is not informed of recovery policy changes until a terminal recovery command occurs that does not result
   * in termination of the run. */
  ignoreErrorKindThisRun: (ignoreErrors: boolean) => Promise<void>
  /* A non-terminal recovery command */
  retryFailedCommand: () => Promise<CommandData[]>
  /* A non-terminal recovery command */
  homePipetteZAxes: () => Promise<CommandData[]>
  /* A non-terminal recovery command */
  pickUpTips: () => Promise<CommandData[]>
  /* A non-terminal recovery command */
  releaseGripperJaws: () => Promise<CommandData[]>
  /* A non-terminal recovery command */
  releaseLabwareLatch: () => Promise<CommandData[]>
  /* A non-terminal recovery command */
  closeLabwareLatch: () => Promise<CommandData[]>
  /* A non-terminal recovery command */
  homeExceptPlungers: () => Promise<CommandData[]>
  /* A non-terminal recovery command */
  moveLabwareWithoutPause: () => Promise<CommandData[]>
  /* A non-terminal recovery-command */
  homeAll: () => Promise<CommandData[]>
  /* A non-terminal recovery-command */
  homeShuttle: () => Promise<CommandData[]>
  /* A non-terminal recovery-command */
  manualRetrieve: () => Promise<CommandData[]>
  /* A non-terminal recovery-command */
  manualStore: () => Promise<CommandData[]>
}

// TODO(jh, 07-24-24): Create tighter abstractions for terminal vs. non-terminal commands.
// Returns commands with a "fixit" intent. Commands may or may not terminate Error Recovery. See each command docstring for details.
export function useRecoveryCommands({
  runId,
  failedCommand,
  unvalidatedFailedCommand,
  failedLabwareUtils,
  routeUpdateActions,
  recoveryToastUtils,
  analytics,
  selectedRecoveryOption,
}: UseRecoveryCommandsParams): UseRecoveryCommandsResult {
  const [ignoreErrors, setIgnoreErrors] = useState(false)
  const {
    documentationState,
    actionsToDocument,
    addActionToDocument,
    resumeAndHandleErrorPolicyDocState,
    clearResumeAndHandleErrorPolicyDocreport,
  } = useErrorRecoveryDocumentation({
    ignoreErrors,
    recoverySessionKey: unvalidatedFailedCommand?.id ?? null,
  })

  const { proceedToRouteAndStep, handleMotionRouting, stashedMapRef } =
    routeUpdateActions
  const { mutateAsync: resumeRunFromRecovery } =
    useResumeRunFromRecoveryMutation(resumeAndHandleErrorPolicyDocState)
  const { mutateAsync: resumeRunFromRecoveryAssumingFalsePositive } =
    useResumeRunFromRecoveryAssumingFalsePositiveMutation(
      resumeAndHandleErrorPolicyDocState
    )
  const { stopRun } = useStopRunMutation(documentationState)

  const updateErrorRecoveryPolicy = useUpdateRecoveryPolicyWithStrategy(
    runId,
    resumeAndHandleErrorPolicyDocState
  )
  const currentRecoveryPolicy = useErrorRecoveryPolicy(runId)?.data?.data
  const { chainRunCommands } = useChainRunCommands(
    runId,
    documentationState,
    actionsToDocument,
    addActionToDocument,
    unvalidatedFailedCommand?.id,
    currentRecoveryPolicy
  )

  const { chainRunCommands: chainRetryRunCommands } = useChainRunCommands(
    runId,
    documentationState,
    [...actionsToDocument, 'retry_action'],
    addActionToDocument,
    unvalidatedFailedCommand?.id,
    currentRecoveryPolicy
  )
  const { makeSuccessToast } = recoveryToastUtils

  const reportAndRouteFailedCmd = (e: Error): Promise<never> => {
    console.warn(`Error executing "fixit" command: ${e}`)
    analytics.reportActionSelectedResult(selectedRecoveryOption, 'failed')
    // Drop any in-motion stash so a later documentation cancel (e.g. from the
    // recovery-failed "back to menu" home) restores this error screen, not the
    // pre-retry step that was stashed when the failed action began.
    stashedMapRef.current = null
    void proceedToRouteAndStep(RECOVERY_MAP.ERROR_WHILE_RECOVERING.ROUTE)

    return Promise.reject(new Error(`Could not execute command: ${e}`))
  }
  // TODO(jh, 11-21-24): Some commands return a 200 with an error body. We should catch these and propagate the error.
  const chainRunRecoveryCommands = useCallback(
    (
      commands: CreateCommand[],
      continuePastFailure: boolean = false,
      chain: typeof chainRunCommands = chainRunCommands
    ): Promise<CommandData[]> => {
      return (
        chain(commands, continuePastFailure)
          // the catch never occurs if continuePastCommandFailure is "true"
          .catch((e: Error) => {
            // User cancelled documentation/login — return to the screen from
            // before this mutation (stashed by handleMotionRouting(true)).
            // Callers such as launch may still close the wizard afterward.
            if (isDocumentedMutationError(e)) {
              return handleMotionRouting(false).then(() => Promise.reject(e))
            }
            return reportAndRouteFailedCmd(e)
          })
      )
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [analytics, selectedRecoveryOption, chainRunCommands, handleMotionRouting]
  )

  const buildRetryPrepMove = ():
    MoveToCoordinatesCreateCommand | LiquidProbeCreateCommand | null => {
    type InPlaceCommand =
      | AspirateInPlaceRunTimeCommand
      | BlowoutInPlaceRunTimeCommand
      | DispenseInPlaceRunTimeCommand
      | DropTipInPlaceRunTimeCommand
      | PrepareToAspirateRunTimeCommand
    type CommandsWithDynamicLiquidTracking =
      AspirateWhileTrackingRunTimeCommand | DispenseWhileTrackingRunTimeCommand

    const IN_PLACE_COMMAND_TYPES = [
      'aspirateInPlace',
      'dispenseInPlace',
      'blowOutInPlace',
      'dropTipInPlace',
      'prepareToAspirate',
    ] as const
    const REQUIRES_LIQUID_PROBE_COMMAND_TYPES = [
      'aspirateWhileTracking',
      'dispenseWhileTracking',
    ] as const

    const isInPlace = (
      failedCommand: FailedCommand | null
    ): failedCommand is InPlaceCommand =>
      unvalidatedFailedCommand != null &&
      IN_PLACE_COMMAND_TYPES.includes(
        (failedCommand as InPlaceCommand).commandType
      )

    const requiresMoveToError = (
      error?: RunCommandError | null
    ): error is
      RunCommandErrorOverpressure | RunCommandErrorTipPhysicallyAttached =>
      error != null &&
      error.isDefined &&
      (error.errorType === DEFINED_ERROR_TYPES.OVERPRESSURE ||
        error.errorType === DEFINED_ERROR_TYPES.TIP_PHYSICALLY_ATTACHED)

    const isLiquidProbePreconditionRequired = (
      failedCommand: FailedCommandBySource['byRunRecord']
    ): boolean =>
      REQUIRES_LIQUID_PROBE_COMMAND_TYPES.includes(
        (failedCommand as CommandsWithDynamicLiquidTracking).commandType
      )

    if (
      isInPlace(unvalidatedFailedCommand) &&
      requiresMoveToError(unvalidatedFailedCommand.error) &&
      // Paranoia: this value comes from the wire and may be unevenly implemented
      typeof unvalidatedFailedCommand.error?.errorInfo?.retryLocation?.at(0) ===
        'number'
    ) {
      const retryLocation =
        unvalidatedFailedCommand.error.errorInfo.retryLocation

      return {
        commandType: 'moveToCoordinates',
        intent: 'fixit',
        params: {
          pipetteId: unvalidatedFailedCommand.params?.pipetteId,
          coordinates: {
            x: retryLocation[0],
            y: retryLocation[1],
            z: retryLocation[2],
          },
        },
      }
    } else if (
      failedCommand != null &&
      isLiquidProbePreconditionRequired(failedCommand.byRunRecord)
    ) {
      const liquidParams = failedCommand.byRunRecord
        .params as AspDispWhileTrackingParams

      const retryLocation: WellLocation = {
        origin: WELL_ORIGIN_TOP,
        offset: {
          x: LIQUID_PROBE_START_OFFSET_FROM_WELL_TOP.x,
          y: LIQUID_PROBE_START_OFFSET_FROM_WELL_TOP.y,
          z: LIQUID_PROBE_START_OFFSET_FROM_WELL_TOP.z,
        },
      }

      return {
        commandType: 'liquidProbe',
        intent: 'fixit',
        params: { ...liquidParams, wellLocation: retryLocation },
      }
    } else {
      return null
    }
  }

  const buildOpenLatch = (
    failedCommand: FailedCommand | null
  ): CreateCommand | null => {
    if (failedCommand == null) {
      return null
    }
    const storeOrRetriveFailedCommandParams = failedCommand.params
    const moduleId =
      'moduleId' in storeOrRetriveFailedCommandParams
        ? storeOrRetriveFailedCommandParams.moduleId
        : ''
    return {
      commandType: 'unsafe/flexStacker/openLatch',
      params: {
        moduleId: moduleId,
      },
      intent: 'fixit',
    }
  }

  const buildCloseLatch = (
    failedCommand: FailedCommand | null
  ): CreateCommand | null => {
    if (failedCommand == null) {
      return null
    }
    const storeOrRetriveFailedCommandParams = failedCommand.params
    const moduleId =
      'moduleId' in storeOrRetriveFailedCommandParams
        ? storeOrRetriveFailedCommandParams.moduleId
        : ''
    return {
      commandType: 'unsafe/flexStacker/closeLatch',
      params: {
        moduleId: moduleId,
      },
      intent: 'fixit',
    }
  }

  const retryFailedCommand = useCallback(
    (): Promise<CommandData[]> => {
      const { commandType, params } = unvalidatedFailedCommand as FailedCommand // Null case is handled before command could be issued.
      return chainRunRecoveryCommands(
        [
          // move back to the location of the command if it is an in-place command
          buildRetryPrepMove(),
          { commandType, params }, // retry the command that failed
        ].filter(c => c != null) as CreateCommand[],
        false,
        chainRetryRunCommands
      ) // the created command is the same command that failed
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      chainRunRecoveryCommands,
      chainRetryRunCommands,
      unvalidatedFailedCommand?.key,
    ]
  )

  // Homes the Z-axis of all attached pipettes.
  const homePipetteZAxes = useCallback((): Promise<CommandData[]> => {
    return chainRunRecoveryCommands([HOME_PIPETTE_Z_AXES])
  }, [chainRunRecoveryCommands])

  // Pick up the user-selected tips
  const pickUpTips = useCallback(
    (): Promise<CommandData[]> => {
      const { selectedTipLocations, relevantPickUpTipLabware } =
        failedLabwareUtils

      const pickUpTipCmd = buildPickUpTips(
        selectedTipLocations,
        unvalidatedFailedCommand,
        relevantPickUpTipLabware
      )

      if (pickUpTipCmd == null) {
        return reportAndRouteFailedCmd(
          new Error('Invalid use of pickUpTips command')
        )
      } else {
        return chainRunRecoveryCommands([pickUpTipCmd])
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chainRunRecoveryCommands, unvalidatedFailedCommand, failedLabwareUtils]
  )

  const ignoreErrorKindThisRun = (ignoreErrors: boolean): Promise<void> => {
    setIgnoreErrors(ignoreErrors)
    return Promise.resolve()
  }

  // Only send the finalized error policy to the server during a terminal recovery command that does not terminate the run.
  // If the request to update the policy fails, route to the error modal.
  const handleIgnoringErrorKind = useCallback(
    (): Promise<void> => {
      if (ignoreErrors) {
        if (unvalidatedFailedCommand?.error != null) {
          const ifMatch: IfMatchType = isAssumeFalsePositiveResumeKind(
            failedCommand
          )
            ? 'assumeFalsePositiveAndContinue'
            : 'ignoreAndContinue'

          const ignorePolicyRules = buildIgnorePolicyRules(
            unvalidatedFailedCommand.commandType,
            unvalidatedFailedCommand.error.errorType,
            ifMatch
          )

          return updateErrorRecoveryPolicy(ignorePolicyRules, 'append')
            .then(() => Promise.resolve())
            .catch((e: Error) => {
              // User cancelled documentation — let resumeRun/skipFailedCommand
              // restore the previous screen instead of showing action-failed.
              if (isDocumentedMutationError(e)) {
                return Promise.reject(e)
              }
              return reportAndRouteFailedCmd(
                new Error(`Failed to update recovery policy: ${e.message}`)
              )
            })
        } else {
          return reportAndRouteFailedCmd(
            new Error('Could not execute command. No failed command.')
          )
        }
      } else {
        return Promise.resolve()
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      unvalidatedFailedCommand?.error?.errorType,
      unvalidatedFailedCommand?.commandType,
      ignoreErrors,
    ]
  )

  const resumeRun = useCallback(
    (): void => {
      void handleIgnoringErrorKind()
        .then(() => resumeRunFromRecovery(runId))
        .then(() => {
          analytics.reportActionSelectedResult(
            selectedRecoveryOption,
            'succeeded'
          )
          makeSuccessToast()
        })
        .catch((error: unknown) => {
          // Allow a retry to re-prompt; policy may have already succeeded.
          clearResumeAndHandleErrorPolicyDocreport()
          if (isDocumentedMutationError(error)) {
            return handleMotionRouting(false)
          }
          // Non-documentation failures already route to ERROR_WHILE_RECOVERING
          // (e.g. via handleIgnoringErrorKind).
        })
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      runId,
      ignoreErrors,
      resumeRunFromRecovery,
      handleIgnoringErrorKind,
      selectedRecoveryOption,
      makeSuccessToast,
      handleMotionRouting,
      clearResumeAndHandleErrorPolicyDocreport,
    ]
  )

  const cancelRun = useCallback((): void => {
    stopRun(runId, {
      onSuccess: () => {
        analytics.reportActionSelectedResult(
          selectedRecoveryOption,
          'succeeded'
        )
      },
      onError: (error: unknown) => {
        // stopRun is not routed through chainRunRecoveryCommands, so handle
        // documentation cancel here. Always return to confirm-cancel rather than
        // restoring a DROP_TIP_FLOWS stash — after tips are removed, that would
        // re-enter the drop tip wizard from the start.
        if (isDocumentedMutationError(error)) {
          stashedMapRef.current = null
          void proceedToRouteAndStep(
            RECOVERY_MAP.CANCEL_RUN.ROUTE,
            RECOVERY_MAP.CANCEL_RUN.STEPS.CONFIRM_CANCEL
          )
        }
      },
    })
  }, [
    runId,
    stopRun,
    proceedToRouteAndStep,
    stashedMapRef,
    selectedRecoveryOption,
    analytics,
  ])

  const handleResumeAction = (): Promise<RunAction> => {
    if (isAssumeFalsePositiveResumeKind(failedCommand)) {
      return resumeRunFromRecoveryAssumingFalsePositive(runId)
    } else {
      return resumeRunFromRecovery(runId)
    }
  }

  const skipFailedCommand = useCallback(
    (): void => {
      void handleIgnoringErrorKind()
        .then(() => handleResumeAction())
        .then(() => {
          analytics.reportActionSelectedResult(
            selectedRecoveryOption,
            'succeeded'
          )
          makeSuccessToast()
        })
        .catch((error: unknown) => {
          // Allow a retry to re-prompt; policy may have already succeeded.
          clearResumeAndHandleErrorPolicyDocreport()
          if (isDocumentedMutationError(error)) {
            return handleMotionRouting(false)
          }
          // Non-documentation failures already route to ERROR_WHILE_RECOVERING
          // (e.g. via handleIgnoringErrorKind). Avoid an unhandled rejection
          // from void call sites.
        })
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      runId,
      resumeRunFromRecovery,
      handleIgnoringErrorKind,
      selectedRecoveryOption,
      makeSuccessToast,
      handleMotionRouting,
      clearResumeAndHandleErrorPolicyDocreport,
    ]
  )

  const releaseGripperJaws = useCallback((): Promise<CommandData[]> => {
    return chainRunRecoveryCommands([RELEASE_GRIPPER_JAW])
  }, [chainRunRecoveryCommands])

  const releaseLabwareLatch = useCallback(
    (): Promise<CommandData[]> => {
      const buildOpenLatchCommand = buildOpenLatch(unvalidatedFailedCommand)
      if (buildOpenLatchCommand == null) {
        return reportAndRouteFailedCmd(
          new Error('Invalid use of open latch command')
        )
      } else {
        return chainRunRecoveryCommands([buildOpenLatchCommand])
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chainRunRecoveryCommands, unvalidatedFailedCommand]
  )

  const closeLabwareLatch = useCallback(
    (): Promise<CommandData[]> => {
      const buildCloseLatchCommand = buildCloseLatch(unvalidatedFailedCommand)
      if (buildCloseLatchCommand == null) {
        return reportAndRouteFailedCmd(
          new Error('Invalid use of close latch command')
        )
      } else {
        return chainRunRecoveryCommands([buildCloseLatchCommand])
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chainRunRecoveryCommands, unvalidatedFailedCommand]
  )

  const homeExceptPlungers = useCallback((): Promise<CommandData[]> => {
    return chainRunRecoveryCommands([HOME_EXCEPT_PLUNGERS])
  }, [chainRunRecoveryCommands])

  const homeAll = useCallback((): Promise<CommandData[]> => {
    return chainRunRecoveryCommands([HOME_ALL])
  }, [chainRunRecoveryCommands])

  const homeShuttle = useCallback((): Promise<CommandData[]> => {
    const homeShuttleCommand = buildHomeShuttle(unvalidatedFailedCommand)
    if (homeShuttleCommand == null) {
      return Promise.reject(new Error('Invalid use of home shuttle command'))
    } else {
      return chainRunRecoveryCommands([homeShuttleCommand])
    }
  }, [chainRunRecoveryCommands, unvalidatedFailedCommand])

  const manualRetrieve = useCallback(
    (): Promise<CommandData[]> => {
      const manualRetrieveCommand = buildManualRetrieve(
        unvalidatedFailedCommand
      )
      if (manualRetrieveCommand == null) {
        return reportAndRouteFailedCmd(
          new Error('Invalid use of manual retrieve command')
        )
      } else {
        return chainRunRecoveryCommands([manualRetrieveCommand])
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chainRunRecoveryCommands, unvalidatedFailedCommand]
  )

  const manualStore = useCallback(
    (): Promise<CommandData[]> => {
      const manualStoreCommand = buildManualStore(unvalidatedFailedCommand)
      if (manualStoreCommand == null) {
        return reportAndRouteFailedCmd(
          new Error('Invalid use of manual store command')
        )
      } else {
        return chainRunRecoveryCommands([manualStoreCommand])
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chainRunRecoveryCommands, unvalidatedFailedCommand]
  )

  const moveLabwareWithoutPause = useCallback(
    (): Promise<CommandData[]> => {
      const moveLabwareCmd = buildMoveLabwareWithoutPause(
        unvalidatedFailedCommand
      )
      if (moveLabwareCmd == null) {
        return reportAndRouteFailedCmd(
          new Error('Invalid use of MoveLabware command')
        )
      } else {
        return chainRunRecoveryCommands([moveLabwareCmd])
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chainRunRecoveryCommands, unvalidatedFailedCommand]
  )

  return {
    resumeRun,
    cancelRun,
    retryFailedCommand,
    homePipetteZAxes,
    pickUpTips,
    releaseGripperJaws,
    homeExceptPlungers,
    moveLabwareWithoutPause,
    skipFailedCommand,
    ignoreErrorKindThisRun,
    homeAll,
    homeShuttle,
    manualRetrieve,
    manualStore,
    closeLabwareLatch,
    releaseLabwareLatch,
  }
}

export function isAssumeFalsePositiveResumeKind(
  failedCommand: UseRecoveryCommandsParams['failedCommand']
): boolean {
  const errorKind = getErrorKind(failedCommand)

  switch (errorKind) {
    case ERROR_KINDS.TIP_NOT_DETECTED:
    case ERROR_KINDS.TIP_DROP_FAILED:
    case ERROR_KINDS.STACKER_STALLED:
    case ERROR_KINDS.STACKER_SHUTTLE_MISSING:
    case ERROR_KINDS.STACKER_HOPPER_EMPTY:
      return true
    default:
      return false
  }
}

export const HOME_PIPETTE_Z_AXES: CreateCommand = {
  commandType: 'home',
  params: { axes: ['leftZ', 'rightZ'] },
  intent: 'fixit',
}

export const RELEASE_GRIPPER_JAW: CreateCommand = {
  commandType: 'unsafe/ungripLabware',
  params: {},
  intent: 'fixit',
}

// in case the gripper does not know the position after a stall/collision we must update the position.
export const UPDATE_ESTIMATORS_EXCEPT_PLUNGERS: CreateCommand = {
  commandType: 'unsafe/updatePositionEstimators',
  params: { axes: ['x', 'y', 'extensionZ'] },
}

export const HOME_EXCEPT_PLUNGERS: CreateCommand = {
  commandType: 'home',
  params: {
    axes: ['extensionJaw', 'extensionZ', 'leftZ', 'rightZ', 'x', 'y'],
  },
}

export const HOME_ALL: CreateCommand = {
  commandType: 'home',
  params: {},
}

const buildHomeShuttle = (
  failedCommand: FailedCommand | null
): CreateCommand | null => {
  if (failedCommand == null) {
    return null
  }
  const storeOrRetriveFailedCommandParams = failedCommand.params
  const moduleId =
    'moduleId' in storeOrRetriveFailedCommandParams
      ? storeOrRetriveFailedCommandParams.moduleId
      : ''
  return {
    commandType: 'unsafe/flexStacker/prepareShuttle',
    params: {
      moduleId: moduleId,
    },
    intent: 'fixit',
  }
}

const buildManualRetrieve = (
  failedCommand: FailedCommand | null
): CreateCommand | null => {
  if (failedCommand == null) {
    return null
  }
  const retrieveCommand = failedCommand as FlexStackerRetrieveRunTimeCommand
  return {
    commandType: 'unsafe/flexStacker/manualRetrieve',
    params: {
      moduleId: retrieveCommand.params.moduleId,
    },
    intent: 'fixit',
  }
}

const buildManualStore = (
  failedCommand: FailedCommand | null
): CreateCommand | null => {
  if (failedCommand == null) {
    return null
  }
  const storeCommand = failedCommand as FlexStackerStoreRunTimeCommand
  return {
    commandType: 'flexStacker/store',
    params: {
      moduleId: storeCommand.params.moduleId,
      strategy: 'manual',
    },
    intent: 'fixit',
  }
}

const buildMoveLabwareWithoutPause = (
  failedCommand: FailedCommand | null
): CreateCommand | null => {
  if (failedCommand == null) {
    return null
  }
  const moveLabwareParams = failedCommand.params as MoveLabwareParams
  return {
    commandType: 'moveLabware',
    params: {
      labwareId: moveLabwareParams.labwareId,
      newLocation: moveLabwareParams.newLocation,
      strategy: 'manualMoveWithoutPause',
    },
    intent: 'fixit',
  }
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
    const wellName = head(Object.keys(tipGroup))!

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

export const buildIgnorePolicyRules = (
  commandType: FailedCommand['commandType'],
  errorType: string,
  ifMatch: IfMatchType
): UpdateErrorRecoveryPolicyWithStrategy['newPolicy'] => ({
  commandType,
  errorType,
  ifMatch,
})
