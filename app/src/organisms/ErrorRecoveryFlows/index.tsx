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
} from './utils'
import { RECOVERY_MAP } from './constants'

import type { RunStatus } from '@opentrons/api-client'
import type { FailedCommand, IRecoveryMap } from './types'

const VALID_ER_RUN_STATUSES: RunStatus[] = [
  RUN_STATUS_AWAITING_RECOVERY,
  RUN_STATUS_STOP_REQUESTED,
]

interface UseErrorRecoveryResult {
  isERActive: boolean
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

interface ErrorRecoveryFlowsProps {
  runId: string
  failedCommand: FailedCommand | null
}

export function ErrorRecoveryFlows({
  runId,
  failedCommand,
}: ErrorRecoveryFlowsProps): JSX.Element | null {
  const enableRunNotes = useFeatureFlag('enableRunNotes')
  const { hasLaunchedRecovery, toggleERWizard, showERWizard } = useERWizard()
  const showSplash = useRunPausedSplash()

  /**
   * ER Wizard routing.
   * Recovery Route: A logically-related collection of recovery steps or a single step if unrelated to any existing recovery route.
   * Recovery Step: Analogous to a "step" in other wizard flows.
   */
  const [recoveryMap, setRecoveryMap] = React.useState<IRecoveryMap>({
    route: RECOVERY_MAP.OPTION_SELECTION.ROUTE,
    step: RECOVERY_MAP.OPTION_SELECTION.STEPS.SELECT,
  })

  const routeUpdateActions = useRouteUpdateActions({
    hasLaunchedRecovery,
    recoveryMap,
    toggleERWizard,
    setRecoveryMap,
  })

  const recoveryCommands = useRecoveryCommands({
    runId,
    failedCommand,
  })

  if (!enableRunNotes) {
    return null
  }

  return (
    <>
      {showERWizard ? (
        <ErrorRecoveryWizard
          failedCommand={failedCommand}
          recoveryMap={recoveryMap}
          routeUpdateActions={routeUpdateActions}
          recoveryCommands={recoveryCommands}
          hasLaunchedRecovery={hasLaunchedRecovery}
        />
      ) : null}
      {showSplash ? (
        <RunPausedSplash
          failedCommand={failedCommand}
          toggleERWiz={toggleERWizard}
          routeUpdateActions={routeUpdateActions}
        />
      ) : null}
    </>
  )
}
