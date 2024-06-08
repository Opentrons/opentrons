import * as React from 'react'

import {
  RUN_STATUS_AWAITING_RECOVERY,
  RUN_STATUS_STOP_REQUESTED,
} from '@opentrons/api-client'

import { useFeatureFlag } from '../../redux/config'
import { ErrorRecoveryWizard, useERWizard } from './ErrorRecoveryWizard'
import { useRunPausedSplash, RunPausedSplash } from './RunPausedSplash'
import {
  useCurrentlyRecoveringFrom,
  useRouteUpdateActions,
  useRecoveryCommands,
  useRecoveryTipStatus,
  usePreviousRecoveryRoute,
  useRecoveryRouting,
} from './utils'

import type { RunStatus } from '@opentrons/api-client'
import type { FailedCommand, IRecoveryMap, RecoveryRoute } from './types'
import type {
  UseRouteUpdateActionsResult,
  UseRecoveryCommandsResult,
  RecoveryTipStatusUtils,
} from './utils'

const VALID_ER_RUN_STATUSES: RunStatus[] = [
  RUN_STATUS_AWAITING_RECOVERY,
  RUN_STATUS_STOP_REQUESTED,
]

interface UseErrorRecoveryResult {
  isERActive: boolean
  /* There is no FailedCommand if the run statis is not AWAITING_RECOVERY. */
  failedCommand: FailedCommand | null
}

export function useErrorRecoveryFlows(
  runId: string,
  runStatus: RunStatus | null
): UseErrorRecoveryResult {
  const [isERActive, setIsERActive] = React.useState(false)
  const failedCommand = useCurrentlyRecoveringFrom(runId, runStatus)

  const isValidRunStatus =
    runStatus != null && VALID_ER_RUN_STATUSES.includes(runStatus)

  if (!isERActive && isValidRunStatus) {
    setIsERActive(true)
  }
  // Because multiple ER flows may occur per run, disable ER when the status is not "awaiting-recovery" or a
  // terminating run status in which we want to persist ER flows. Specific recovery commands cause run status to change.
  // See a specific command's docstring for details.
  else if (isERActive && !isValidRunStatus) {
    setIsERActive(false)
  }

  return {
    isERActive,
    failedCommand,
  }
}

export interface ErrorRecoveryFlowsProps {
  runId: string
  failedCommand: FailedCommand | null
  isFlex: boolean
}

export function ErrorRecoveryFlows(
  props: ErrorRecoveryFlowsProps
): JSX.Element | null {
  const { runId, failedCommand, isFlex } = props
  const enableRunNotes = useFeatureFlag('enableRunNotes')
  const { hasLaunchedRecovery, toggleERWizard, showERWizard } = useERWizard()
  const showSplash = useRunPausedSplash()

  const recoveryUtils = useERUtils({
    isFlex,
    failedCommand,
    runId,
    toggleERWizard,
    hasLaunchedRecovery,
  })

  if (!enableRunNotes) {
    return null
  }

  return (
    <>
      {showERWizard ? (
        <ErrorRecoveryWizard {...props} {...recoveryUtils} />
      ) : null}
      {showSplash ? (
        <RunPausedSplash
          failedCommand={failedCommand}
          toggleERWiz={toggleERWizard}
          routeUpdateActions={recoveryUtils.routeUpdateActions}
        />
      ) : null}
    </>
  )
}

type ERUtilsProps = ErrorRecoveryFlowsProps & {
  toggleERWizard: (launchER: boolean) => Promise<void>
  hasLaunchedRecovery: boolean
}

export interface ERUtilsResults {
  recoveryMap: IRecoveryMap
  previousRoute: RecoveryRoute | null
  routeUpdateActions: UseRouteUpdateActionsResult
  recoveryCommands: UseRecoveryCommandsResult
  tipStatusUtils: RecoveryTipStatusUtils
  hasLaunchedRecovery: boolean
  trackExternalStep: (step: string) => void
}

// Builds various Error Recovery hooks.
function useERUtils({
  isFlex,
  failedCommand,
  runId,
  toggleERWizard,
  hasLaunchedRecovery,
}: ERUtilsProps): ERUtilsResults {
  const { recoveryMap, setRM, trackExternalStep } = useRecoveryRouting()
  const previousRoute = usePreviousRecoveryRoute(recoveryMap.route)
  const tipStatusUtils = useRecoveryTipStatus(runId, isFlex)
  const routeUpdateActions = useRouteUpdateActions({
    hasLaunchedRecovery,
    recoveryMap,
    toggleERWizard,
    setRecoveryMap: setRM,
  })
  const recoveryCommands = useRecoveryCommands({
    runId,
    failedCommand,
  })

  return {
    recoveryMap,
    trackExternalStep,
    previousRoute,
    routeUpdateActions,
    recoveryCommands,
    hasLaunchedRecovery,
    tipStatusUtils,
  }
}
