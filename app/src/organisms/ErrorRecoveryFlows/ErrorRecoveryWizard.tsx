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
import { SelectRecoveryOption, ResumeRun } from './RecoveryOptions'
import { ErrorRecoveryHeader } from './ErrorRecoveryHeader'
import { RecoveryInProgress } from './RecoveryInProgress'
import { getErrorKind, useRouteUpdateActions } from './utils'
import { useRecoveryCommands } from './useRecoveryCommands'
import { RECOVERY_MAP } from './constants'

import type { FailedCommand, IRecoveryMap, RecoveryContentProps } from './types'

export interface ErrorRecoveryFlowsProps {
  runId: string
  failedCommand: FailedCommand | null
}

export function ErrorRecoveryWizard({
  runId,
  failedCommand,
}: ErrorRecoveryFlowsProps): JSX.Element {
  /**
   * Recovery Route: A logically-related collection of recovery steps or a single step if unrelated to any existing recovery route.
   * Recovery Step: Analogous to a "step" in other wizard flows.
   */
  const [recoveryMap, setRecoveryMap] = React.useState<IRecoveryMap>({
    route: RECOVERY_MAP.OPTION_SELECTION.ROUTE,
    step: RECOVERY_MAP.OPTION_SELECTION.STEPS.SELECT,
  })

  const errorKind = getErrorKind(failedCommand?.error?.errorType)
  const isOnDevice = useSelector(getIsOnDevice)
  const routeUpdateActions = useRouteUpdateActions({
    recoveryMap,
    setRecoveryMap,
  })
  const recoveryCommands = useRecoveryCommands({
    runId,
    failedCommand,
  })

  useInitialPipetteHome(recoveryCommands, routeUpdateActions)

  return (
    <ErrorRecoveryComponent
      failedCommand={failedCommand}
      errorKind={errorKind}
      isOnDevice={isOnDevice}
      recoveryMap={recoveryMap}
      routeUpdateActions={routeUpdateActions}
      recoveryCommands={recoveryCommands}
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
    return <ResumeRun {...props} />
  }

  switch (props.recoveryMap.route) {
    case RECOVERY_MAP.BEFORE_BEGINNING.ROUTE:
      return buildBeforeBeginning()
    case RECOVERY_MAP.OPTION_SELECTION.ROUTE:
      return buildSelectRecoveryOption()
    case RECOVERY_MAP.RESUME.ROUTE:
      return buildResumeRun()
    case RECOVERY_MAP.ROBOT_IN_MOTION.ROUTE:
    case RECOVERY_MAP.ROBOT_RESUMING.ROUTE:
    case RECOVERY_MAP.ROBOT_RETRYING_COMMAND.ROUTE:
      return buildRecoveryInProgress()
    default:
      return buildSelectRecoveryOption()
  }
}

// Home the Z-axis of all attached pipettes on Error Recovery launch.
export function useInitialPipetteHome(
  recoveryCommands: ReturnType<typeof useRecoveryCommands>,
  routeUpdateActions: ReturnType<typeof useRouteUpdateActions>
): void {
  const { homePipetteZAxes } = recoveryCommands
  const { setRobotInMotion } = routeUpdateActions

  // Synchronously set the recovery route to "robot in motion" before initial render to prevent screen flicker on ER launch.
  React.useLayoutEffect(() => {
    void setRobotInMotion(true)
      .then(() => homePipetteZAxes())
      .finally(() => setRobotInMotion(false))
  }, [])
}
