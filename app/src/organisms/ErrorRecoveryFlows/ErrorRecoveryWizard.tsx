import * as React from 'react'
import { createPortal } from 'react-dom'
import { useSelector } from 'react-redux'

import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  POSITION_ABSOLUTE,
} from '@opentrons/components'

import { getIsOnDevice } from '../../redux/config'
import { getTopPortalEl } from '../../App/portal'
import { BeforeBeginning } from './BeforeBeginning'
import { SelectRecoveryOption, RetryStep, CancelRun } from './RecoveryOptions'
import { ErrorRecoveryHeader } from './ErrorRecoveryHeader'
import { RecoveryInProgress } from './RecoveryInProgress'
import { getErrorKind } from './utils'
import { RECOVERY_MAP } from './constants'

import type { FailedCommand, IRecoveryMap, RecoveryContentProps } from './types'
import type {
  useRouteUpdateActions,
  UseRouteUpdateActionsResult,
} from './utils'
import type {
  useRecoveryCommands,
  UseRecoveryCommandsResult,
} from './useRecoveryCommands'

export interface ErrorRecoveryFlowsProps {
  failedCommand: FailedCommand | null
  recoveryMap: IRecoveryMap
  routeUpdateActions: UseRouteUpdateActionsResult
  recoveryCommands: UseRecoveryCommandsResult
  hasLaunchedRecovery: boolean
}

export function ErrorRecoveryWizard(
  props: ErrorRecoveryFlowsProps
): JSX.Element {
  const {
    hasLaunchedRecovery,
    failedCommand,
    recoveryCommands,
    routeUpdateActions,
  } = props
  const errorKind = getErrorKind(failedCommand?.error?.errorType)
  const isOnDevice = useSelector(getIsOnDevice)

  useInitialPipetteHome({
    hasLaunchedRecovery,
    recoveryCommands,
    routeUpdateActions,
  })

  return (
    <ErrorRecoveryComponent
      errorKind={errorKind}
      isOnDevice={isOnDevice}
      {...props}
    />
  )
}

function ErrorRecoveryComponent(props: RecoveryContentProps): JSX.Element {
  return createPortal(
    <Flex
      flexDirection={DIRECTION_COLUMN}
      width="992px"
      height="568px"
      left="14.5px"
      top="16px"
      borderRadius={BORDERS.borderRadius12}
      position={POSITION_ABSOLUTE}
      backgroundColor={COLORS.white}
    >
      <ErrorRecoveryHeader errorKind={props.errorKind} />
      <ErrorRecoveryContent {...props} />
    </Flex>,
    getTopPortalEl()
  )
}

export function ErrorRecoveryContent(props: RecoveryContentProps): JSX.Element {
  const buildBeforeBeginning = (): JSX.Element => {
    return <BeforeBeginning {...props} />
  }

  const buildSelectRecoveryOption = (): JSX.Element => {
    return <SelectRecoveryOption {...props} />
  }

  const buildRecoveryInProgress = (): JSX.Element => {
    return <RecoveryInProgress {...props} />
  }

  const buildResumeRun = (): JSX.Element => {
    return <RetryStep {...props} />
  }

  const buildCancelRun = (): JSX.Element => {
    return <CancelRun {...props} />
  }

  switch (props.recoveryMap.route) {
    case RECOVERY_MAP.BEFORE_BEGINNING.ROUTE:
      return buildBeforeBeginning()
    case RECOVERY_MAP.OPTION_SELECTION.ROUTE:
      return buildSelectRecoveryOption()
    case RECOVERY_MAP.RETRY_FAILED_COMMAND.ROUTE:
      return buildResumeRun()
    case RECOVERY_MAP.CANCEL_RUN.ROUTE:
      return buildCancelRun()
    case RECOVERY_MAP.ROBOT_IN_MOTION.ROUTE:
    case RECOVERY_MAP.ROBOT_RESUMING.ROUTE:
    case RECOVERY_MAP.ROBOT_RETRYING_COMMAND.ROUTE:
    case RECOVERY_MAP.ROBOT_CANCELING.ROUTE:
      return buildRecoveryInProgress()
    default:
      return buildSelectRecoveryOption()
  }
}
interface UseInitialPipetteHomeParams {
  hasLaunchedRecovery: boolean
  recoveryCommands: ReturnType<typeof useRecoveryCommands>
  routeUpdateActions: ReturnType<typeof useRouteUpdateActions>
}
// Home the Z-axis of all attached pipettes on Error Recovery launch.
export function useInitialPipetteHome({
  hasLaunchedRecovery,
  recoveryCommands,
  routeUpdateActions,
}: UseInitialPipetteHomeParams): void {
  const { homePipetteZAxes } = recoveryCommands
  const { setRobotInMotion } = routeUpdateActions

  // Synchronously set the recovery route to "robot in motion" before initial render to prevent screen flicker on ER launch.
  React.useLayoutEffect(() => {
    if (hasLaunchedRecovery) {
      void setRobotInMotion(true)
        .then(() => homePipetteZAxes())
        .finally(() => setRobotInMotion(false))
    }
  }, [hasLaunchedRecovery])
}
