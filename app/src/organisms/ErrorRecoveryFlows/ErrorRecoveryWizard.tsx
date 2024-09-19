import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import { CURSOR_POINTER, StyledText } from '@opentrons/components'

import { RecoveryError } from './RecoveryError'
import { RecoveryDoorOpen } from './RecoveryDoorOpen'
import {
  SelectRecoveryOption,
  RetryStep,
  CancelRun,
  RetryNewTips,
  ManageTips,
  FillWellAndSkip,
  RetrySameTips,
  SkipStepSameTips,
  SkipStepNewTips,
  IgnoreErrorSkipStep,
} from './RecoveryOptions'
import {
  useErrorDetailsModal,
  ErrorDetailsModal,
  RecoveryInterventionModal,
} from './shared'
import { RecoveryInProgress } from './RecoveryInProgress'
import { getErrorKind } from './utils'
import { RECOVERY_MAP } from './constants'

import type { RobotType } from '@opentrons/shared-data'
import type { RecoveryContentProps } from './types'
import type {
  ERUtilsResults,
  UseRecoveryAnalyticsResult,
  useRetainedFailedCommandBySource,
} from './hooks'
import type { ErrorRecoveryFlowsProps } from '.'

export interface UseERWizardResult {
  hasLaunchedRecovery: boolean
  showERWizard: boolean
  toggleERWizard: (isActive: boolean, hasLaunchedER?: boolean) => Promise<void>
}

export function useERWizard(): UseERWizardResult {
  const [showERWizard, setShowERWizard] = React.useState(false)
  // Because RunPausedSplash has access to some ER Wiz routes but is not a part of the ER wizard, the splash screen
  // is the "home" route as opposed to SelectRecoveryOption (accessed by pressing "go back" or "continue" enough times)
  // when recovery mode has not been launched.
  const [hasLaunchedRecovery, setHasLaunchedRecovery] = React.useState(false)

  const toggleERWizard = (
    isActive: boolean,
    hasLaunchedER?: boolean
  ): Promise<void> => {
    if (hasLaunchedER !== undefined) {
      setHasLaunchedRecovery(hasLaunchedER)
    }
    setShowERWizard(isActive)
    return Promise.resolve()
  }

  return { showERWizard, toggleERWizard, hasLaunchedRecovery }
}

export type ErrorRecoveryWizardProps = ErrorRecoveryFlowsProps &
  ERUtilsResults & {
    robotType: RobotType
    isOnDevice: boolean
    analytics: UseRecoveryAnalyticsResult
    failedCommand: ReturnType<typeof useRetainedFailedCommandBySource>
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
  const errorKind = getErrorKind(failedCommand?.byRunRecord ?? null)

  useInitialPipetteHome({
    hasLaunchedRecovery,
    recoveryCommands,
    routeUpdateActions,
  })

  return <ErrorRecoveryComponent errorKind={errorKind} {...props} />
}

export function ErrorRecoveryComponent(
  props: RecoveryContentProps
): JSX.Element {
  const {
    recoveryMap,
    hasLaunchedRecovery,
    doorStatusUtils,
    isOnDevice,
    analytics,
  } = props
  const { isProhibitedDoorOpen } = doorStatusUtils
  const { route, step } = recoveryMap
  const { t } = useTranslation('error_recovery')
  const { showModal, toggleModal } = useErrorDetailsModal()

  React.useEffect(() => {
    if (showModal) {
      analytics.reportViewErrorDetailsEvent(route, step)
    }
  }, [analytics, route, showModal, step])

  const buildTitleHeading = (): JSX.Element => {
    const titleText = hasLaunchedRecovery ? t('recovery_mode') : t('cancel_run')
    return (
      <StyledText
        oddStyle="level4HeaderBold"
        desktopStyle="headingSmallRegular"
      >
        {titleText}
      </StyledText>
    )
  }

  const buildIconHeading = (): JSX.Element => (
    <StyledText
      oddStyle="bodyTextSemiBold"
      desktopStyle="bodyDefaultSemiBold"
      css={css`
        cursor: ${CURSOR_POINTER};
      `}
    >
      {t('view_error_details')}
    </StyledText>
  )

  // TODO(jh, 07-29-24): Make RecoveryDoorOpen render logic equivalent to RecoveryTakeover. Do not nest it in RecoveryWizard.
  const buildInterventionContent = (): JSX.Element => {
    if (isProhibitedDoorOpen) {
      return <RecoveryDoorOpen {...props} />
    } else {
      return <ErrorRecoveryContent {...props} />
    }
  }

  const isLargeDesktopStyle =
    !isProhibitedDoorOpen &&
    route === RECOVERY_MAP.DROP_TIP_FLOWS.ROUTE &&
    step !== RECOVERY_MAP.DROP_TIP_FLOWS.STEPS.BEGIN_REMOVAL
  const desktopType = isLargeDesktopStyle ? 'desktop-large' : 'desktop-small'

  return (
    <RecoveryInterventionModal
      iconHeading={buildIconHeading()}
      titleHeading={buildTitleHeading()}
      iconHeadingOnClick={toggleModal}
      iconName="information"
      desktopType={desktopType}
      isOnDevice={isOnDevice}
    >
      {showModal ? (
        <ErrorDetailsModal
          {...props}
          toggleModal={toggleModal}
          desktopType={desktopType}
        />
      ) : null}
      {buildInterventionContent()}
    </RecoveryInterventionModal>
  )
}

export function ErrorRecoveryContent(props: RecoveryContentProps): JSX.Element {
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

  const buildRetrySameTips = (): JSX.Element => {
    return <RetrySameTips {...props} />
  }

  const buildFillWellAndSkip = (): JSX.Element => {
    return <FillWellAndSkip {...props} />
  }

  const buildSkipStepSameTips = (): JSX.Element => {
    return <SkipStepSameTips {...props} />
  }

  const buildSkipStepNewTips = (): JSX.Element => {
    return <SkipStepNewTips {...props} />
  }

  const buildIgnoreErrorSkipStep = (): JSX.Element => {
    return <IgnoreErrorSkipStep {...props} />
  }

  const buildManuallyRouteToDoorOpen = (): JSX.Element => {
    return <RecoveryDoorOpen {...props} />
  }

  switch (props.recoveryMap.route) {
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
    case RECOVERY_MAP.RETRY_SAME_TIPS.ROUTE:
      return buildRetrySameTips()
    case RECOVERY_MAP.FILL_MANUALLY_AND_SKIP.ROUTE:
      return buildFillWellAndSkip()
    case RECOVERY_MAP.SKIP_STEP_WITH_SAME_TIPS.ROUTE:
      return buildSkipStepSameTips()
    case RECOVERY_MAP.SKIP_STEP_WITH_NEW_TIPS.ROUTE:
      return buildSkipStepNewTips()
    case RECOVERY_MAP.IGNORE_AND_SKIP.ROUTE:
      return buildIgnoreErrorSkipStep()
    case RECOVERY_MAP.ROBOT_IN_MOTION.ROUTE:
    case RECOVERY_MAP.ROBOT_RESUMING.ROUTE:
    case RECOVERY_MAP.ROBOT_RETRYING_STEP.ROUTE:
    case RECOVERY_MAP.ROBOT_CANCELING.ROUTE:
    case RECOVERY_MAP.ROBOT_PICKING_UP_TIPS.ROUTE:
    case RECOVERY_MAP.ROBOT_SKIPPING_STEP.ROUTE:
      return buildRecoveryInProgress()
    case RECOVERY_MAP.ROBOT_DOOR_OPEN.ROUTE:
      return buildManuallyRouteToDoorOpen()
    default:
      return buildSelectRecoveryOption()
  }
}
interface UseInitialPipetteHomeParams {
  hasLaunchedRecovery: ErrorRecoveryWizardProps['hasLaunchedRecovery']
  recoveryCommands: ErrorRecoveryWizardProps['recoveryCommands']
  routeUpdateActions: ErrorRecoveryWizardProps['routeUpdateActions']
}
// Home the Z-axis of all attached pipettes on Error Recovery launch.
export function useInitialPipetteHome({
  hasLaunchedRecovery,
  recoveryCommands,
  routeUpdateActions,
}: UseInitialPipetteHomeParams): void {
  const { homePipetteZAxes } = recoveryCommands
  const { handleMotionRouting } = routeUpdateActions

  // Synchronously set the recovery route to "robot in motion" before initial render to prevent screen flicker on ER launch.
  React.useLayoutEffect(() => {
    if (hasLaunchedRecovery) {
      void handleMotionRouting(true)
        .then(() => homePipetteZAxes())
        .finally(() => handleMotionRouting(false))
    }
  }, [hasLaunchedRecovery])
}
