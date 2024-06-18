import * as React from 'react'
import { createPortal } from 'react-dom'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'

import { getIsOnDevice } from '../../redux/config'
import { getTopPortalEl } from '../../App/portal'
import { InterventionModal } from '../../molecules/InterventionModal'
import { BeforeBeginning } from './BeforeBeginning'
import { RecoveryError } from './RecoveryError'
import {
  SelectRecoveryOption,
  RetryStep,
  CancelRun,
  RetryNewTips,
  ManageTips,
} from './RecoveryOptions'
import { RecoveryInProgress } from './RecoveryInProgress'
import { getErrorKind } from './hooks'
import { RECOVERY_MAP } from './constants'

import type { RobotType } from '@opentrons/shared-data'
import type { RecoveryContentProps } from './types'
import type {
  useRouteUpdateActions,
  useRecoveryCommands,
  ERUtilsResults,
} from './hooks'
import type { ErrorRecoveryFlowsProps } from '.'

interface UseERWizardResult {
  hasLaunchedRecovery: boolean
  showERWizard: boolean
  toggleERWizard: (hasLaunchedER: boolean) => Promise<void>
}

export function useERWizard(): UseERWizardResult {
  const [showERWizard, setShowERWizard] = React.useState(false)
  // Because RunPausedSplash has access to some ER Wiz routes but is not a part of the ER wizard, the splash screen
  // is the "home" route as opposed to SelectRecoveryOption (accessed by pressing "go back" or "continue" enough times)
  // when recovery mode has not been launched.
  const [hasLaunchedRecovery, setHasLaunchedRecovery] = React.useState(false)

  const toggleERWizard = (hasLaunchedER: boolean): Promise<void> => {
    setHasLaunchedRecovery(hasLaunchedER)
    setShowERWizard(!showERWizard)
    return Promise.resolve()
  }

  return { showERWizard, toggleERWizard, hasLaunchedRecovery }
}

export type ErrorRecoveryWizardProps = ErrorRecoveryFlowsProps &
  ERUtilsResults & {
    robotType: RobotType
  }

export function ErrorRecoveryWizard(
  props: ErrorRecoveryWizardProps
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

export function ErrorRecoveryComponent(
  props: RecoveryContentProps
): JSX.Element {
  const { t } = useTranslation('error_recovery')

  const buildTitleHeading = (): JSX.Element => {
    const titleText = props.hasLaunchedRecovery
      ? t('recovery_mode')
      : t('cancel_run')
    return <StyledText as="h4Bold">{titleText}</StyledText>
  }

  const buildIconHeading = (): JSX.Element => (
    <StyledText as="pSemiBold">{t('view_error_details')}</StyledText>
  )

  return createPortal(
    <InterventionModal
      iconName="information"
      iconHeading={buildIconHeading()}
      titleHeading={buildTitleHeading()}
      type="error"
    >
      <ErrorRecoveryContent {...props} />
    </InterventionModal>,
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

  const buildRecoveryError = (): JSX.Element => {
    return <RecoveryError {...props} />
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

  const buildManageTips = (): JSX.Element => {
    return <ManageTips {...props} />
  }

  const buildRetryNewTips = (): JSX.Element => {
    return <RetryNewTips {...props} />
  }

  switch (props.recoveryMap.route) {
    case RECOVERY_MAP.BEFORE_BEGINNING.ROUTE:
      return buildBeforeBeginning()
    case RECOVERY_MAP.OPTION_SELECTION.ROUTE:
      return buildSelectRecoveryOption()
    case RECOVERY_MAP.ERROR_WHILE_RECOVERING.ROUTE:
      return buildRecoveryError()
    case RECOVERY_MAP.RETRY_FAILED_COMMAND.ROUTE:
      return buildResumeRun()
    case RECOVERY_MAP.CANCEL_RUN.ROUTE:
      return buildCancelRun()
    case RECOVERY_MAP.DROP_TIP_FLOWS.ROUTE:
      return buildManageTips()
    case RECOVERY_MAP.RETRY_NEW_TIPS.ROUTE:
      return buildRetryNewTips()
    case RECOVERY_MAP.ROBOT_IN_MOTION.ROUTE:
    case RECOVERY_MAP.ROBOT_RESUMING.ROUTE:
    case RECOVERY_MAP.ROBOT_RETRYING_STEP.ROUTE:
    case RECOVERY_MAP.ROBOT_CANCELING.ROUTE:
    case RECOVERY_MAP.ROBOT_PICKING_UP_TIPS.ROUTE:
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
