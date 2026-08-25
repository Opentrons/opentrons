import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import { CURSOR_POINTER, StyledText } from '@opentrons/components'

import { RECOVERY_MAP } from './constants'
import { RecoveryDoorOpen } from './RecoveryDoorOpen'
import { RecoveryError } from './RecoveryError'
import { RecoveryInProgress } from './RecoveryInProgress'
import {
  CancelRun,
  FillWellAndRetryNewTips,
  FillWellAndRetrySameTips,
  HomeAndRetry,
  IgnoreErrorSkipStep,
  ManageTips,
  ManualMoveLwAndSkip,
  ManualReplaceLwAndRetry,
  RetryNewTips,
  RetrySameTips,
  RetryStep,
  SelectRecoveryOption,
  SkipStepNewTips,
  SkipStepSameTips,
  StackerHopperEmptyRetry,
  StackerHopperEmptySkip,
  StackerSelectErrorFlow,
  StackerShuttleEmptyRetry,
  StackerShuttleEmptySkip,
  StackerShuttleEmptyStoreRetry,
  StackerShuttleEmptyStoreSkip,
  StackerShuttleMissing,
  StackerStalledRetry,
  StackerStalledSkip,
  StackerStalledStoreRetry,
  StackerStalledStoreSkip,
  VacuumCarboyFullRetry,
  VacuumCarboyFullSkip,
  VacuumPressureNotReachedRetry,
} from './RecoveryOptions'
import { ShuttleFullRetry } from './RecoveryOptions/ShuttleFullRetry'
import { ShuttleFullSkip } from './RecoveryOptions/ShuttleFullSkip'
import {
  ErrorDetailsModal,
  RecoveryDoorOpenSpecial,
  RecoveryInterventionModal,
  useErrorDetailsModal,
} from './shared'
import { getErrorKind } from './utils'

import type { ReactNode } from 'react'
import type { LabwareDefinition, RobotType } from '@opentrons/shared-data'
import type { UseRecoveryAnalyticsResult } from '/app/redux-resources/analytics'
import type { ErrorRecoveryFlowsProps } from '.'
import type { ERUtilsResults, useRetainedFailedCommandBySource } from './hooks'
import type { RecoveryContentProps, RecoveryRoute, RouteStep } from './types'

export interface UseERWizardResult {
  hasLaunchedRecovery: boolean
  showERWizard: boolean
  toggleERWizard: (isActive: boolean, hasLaunchedER?: boolean) => Promise<void>
}

export function useERWizard(): UseERWizardResult {
  const [showERWizard, setShowERWizard] = useState(false)
  // Because RunPausedSplash has access to some ER Wiz routes but is not a part of the ER wizard, the splash screen
  // is the "home" route as opposed to SelectRecoveryOption (accessed by pressing "go back" or "continue" enough times)
  // when recovery mode has not been launched.
  const [hasLaunchedRecovery, setHasLaunchedRecovery] = useState(false)

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
    analytics: UseRecoveryAnalyticsResult<RecoveryRoute, RouteStep>
    failedCommand: ReturnType<typeof useRetainedFailedCommandBySource>
    allRunDefs: LabwareDefinition[]
  }

export function ErrorRecoveryWizard(
  props: ErrorRecoveryWizardProps
): ReactNode {
  return (
    <ErrorRecoveryComponent
      errorKind={getErrorKind(props.failedCommand)}
      {...props}
    />
  )
}

export function ErrorRecoveryComponent(props: RecoveryContentProps): ReactNode {
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

  useEffect(() => {
    if (showModal) {
      analytics.reportViewErrorDetailsEvent(route, step)
    }
  }, [analytics, route, showModal, step])

  const buildTitleHeading = (): JSX.Element => {
    const titleText = hasLaunchedRecovery ? t('recovery_mode') : t('cancel_run')
    return (
      <StyledText oddStyle="level4HeaderBold" desktopStyle="bodyLargeSemiBold">
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

export function ErrorRecoveryContent(props: RecoveryContentProps): ReactNode {
  const buildSelectRecoveryOption = (): JSX.Element => {
    return <SelectRecoveryOption {...props} />
  }

  const buildRecoveryError = (): JSX.Element => {
    return <RecoveryError {...props} />
  }

  const buildRecoveryInProgress = (): JSX.Element => {
    return <RecoveryInProgress {...props} />
  }

  const buildRetryStep = (): JSX.Element => {
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

  const buildFillWellAndRetrySameTips = (): JSX.Element => {
    return <FillWellAndRetrySameTips {...props} />
  }

  const buildFillWellAndRetryNewTips = (): JSX.Element => {
    return <FillWellAndRetryNewTips {...props} />
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

  const buildManualMoveLwAndSkip = (): JSX.Element => {
    return <ManualMoveLwAndSkip {...props} />
  }

  const buildManualReplaceLwAndRetry = (): JSX.Element => {
    return <ManualReplaceLwAndRetry {...props} />
  }

  const buildManuallyRouteToDoorOpen = (): JSX.Element => {
    return <RecoveryDoorOpen {...props} />
  }

  const buildRecoveryDoorOpenSpecial = (): JSX.Element => {
    return <RecoveryDoorOpenSpecial {...props} />
  }

  const buildHomeAndRetry = (): JSX.Element => {
    return <HomeAndRetry {...props} />
  }

  const buildStackerHopperEmptyRetry = (): JSX.Element => {
    return <StackerHopperEmptyRetry {...props} />
  }
  const buildStackerHopperEmptySkip = (): JSX.Element => {
    return <StackerHopperEmptySkip {...props} />
  }
  const buildStackerShuttleEmptyStoreRetry = (): JSX.Element => {
    return <StackerShuttleEmptyStoreRetry {...props} />
  }
  const buildStackerShuttleEmptyStoreSkip = (): JSX.Element => {
    return <StackerShuttleEmptyStoreSkip {...props} />
  }
  const buildStackerShuttleEmptyRetry = (): JSX.Element => {
    return <StackerShuttleEmptyRetry {...props} />
  }
  const buildStackerShuttleEmptySkip = (): JSX.Element => {
    return <StackerShuttleEmptySkip {...props} />
  }
  const buildStackerShuttleMissing = (): JSX.Element => {
    return <StackerShuttleMissing {...props} />
  }
  const buildShuttleFullRetry = (): JSX.Element => {
    return <ShuttleFullRetry {...props} />
  }
  const buildShuttleFullSkip = (): JSX.Element => {
    return <ShuttleFullSkip {...props} />
  }
  const buildStackerStalledRetry = (): JSX.Element => {
    return <StackerStalledRetry {...props} />
  }
  const buildStackerStalledSkip = (): JSX.Element => {
    return <StackerStalledSkip {...props} />
  }
  const buildStackerSelectErrorFlow = (): JSX.Element => {
    return <StackerSelectErrorFlow {...props} />
  }
  const buildStackerStalledStoreRetry = (): JSX.Element => {
    return <StackerStalledStoreRetry {...props} />
  }
  const buildStackerStalledStoreSkip = (): JSX.Element => {
    return <StackerStalledStoreSkip {...props} />
  }
  const buildVacuumCarboyFullRetry = (): JSX.Element => {
    return <VacuumCarboyFullRetry {...props} />
  }
  const buildVacuumCarboyFullSkip = (): JSX.Element => {
    return <VacuumCarboyFullSkip {...props} />
  }
  const buildVacuumPressureNotReachedRetry = (): JSX.Element => {
    return <VacuumPressureNotReachedRetry {...props} />
  }

  switch (props.recoveryMap.route) {
    case RECOVERY_MAP.OPTION_SELECTION.ROUTE:
      return buildSelectRecoveryOption()
    case RECOVERY_MAP.ERROR_WHILE_RECOVERING.ROUTE:
      return buildRecoveryError()
    case RECOVERY_MAP.RETRY_STEP.ROUTE:
      return buildRetryStep()
    case RECOVERY_MAP.CANCEL_RUN.ROUTE:
      return buildCancelRun()
    case RECOVERY_MAP.DROP_TIP_FLOWS.ROUTE:
      return buildManageTips()
    case RECOVERY_MAP.RETRY_NEW_TIPS.ROUTE:
      return buildRetryNewTips()
    case RECOVERY_MAP.RETRY_SAME_TIPS.ROUTE:
      return buildRetrySameTips()
    case RECOVERY_MAP.MANUAL_FILL_AND_RETRY_SAME_TIPS.ROUTE:
      return buildFillWellAndRetrySameTips()
    case RECOVERY_MAP.MANUAL_FILL_AND_RETRY_NEW_TIPS.ROUTE:
      return buildFillWellAndRetryNewTips()
    case RECOVERY_MAP.SKIP_STEP_WITH_SAME_TIPS.ROUTE:
      return buildSkipStepSameTips()
    case RECOVERY_MAP.SKIP_STEP_WITH_NEW_TIPS.ROUTE:
      return buildSkipStepNewTips()
    case RECOVERY_MAP.IGNORE_AND_SKIP.ROUTE:
      return buildIgnoreErrorSkipStep()
    case RECOVERY_MAP.MANUAL_MOVE_AND_SKIP.ROUTE:
      return buildManualMoveLwAndSkip()
    case RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.ROUTE:
      return buildManualReplaceLwAndRetry()
    case RECOVERY_MAP.STACKER_HOPPER_OR_SHUTTLE_EMPTY.ROUTE:
      return buildStackerSelectErrorFlow()
    case RECOVERY_MAP.STACKER_HOPPER_EMPTY_RETRY.ROUTE:
      return buildStackerHopperEmptyRetry()
    case RECOVERY_MAP.STACKER_HOPPER_EMPTY_SKIP.ROUTE:
      return buildStackerHopperEmptySkip()
    case RECOVERY_MAP.SHUTTLE_FULL_RETRY.ROUTE:
      return buildShuttleFullRetry()
    case RECOVERY_MAP.SHUTTLE_FULL_SKIP.ROUTE:
      return buildShuttleFullSkip()
    case RECOVERY_MAP.STACKER_STALLED_RETRY.ROUTE:
      return buildStackerStalledRetry()
    case RECOVERY_MAP.STACKER_STALLED_SKIP.ROUTE:
      return buildStackerStalledSkip()
    case RECOVERY_MAP.STACKER_STALLED_STORE_RETRY.ROUTE:
      return buildStackerStalledStoreRetry()
    case RECOVERY_MAP.STACKER_STALLED_STORE_SKIP.ROUTE:
      return buildStackerStalledStoreSkip()
    case RECOVERY_MAP.STACKER_SHUTTLE_MISSING_RETRY.ROUTE:
      return buildStackerShuttleMissing()
    case RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_RETRY.ROUTE:
      return buildStackerShuttleEmptyRetry()
    case RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.ROUTE:
      return buildStackerShuttleEmptySkip()
    case RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_STORE_RETRY.ROUTE:
      return buildStackerShuttleEmptyStoreRetry()
    case RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_STORE_SKIP.ROUTE:
      return buildStackerShuttleEmptyStoreSkip()
    case RECOVERY_MAP.ROBOT_DOOR_OPEN_SPECIAL.ROUTE:
      return buildRecoveryDoorOpenSpecial()
    case RECOVERY_MAP.ROBOT_IN_MOTION.ROUTE:
    case RECOVERY_MAP.ROBOT_RESUMING.ROUTE:
    case RECOVERY_MAP.ROBOT_RETRYING_STEP.ROUTE:
    case RECOVERY_MAP.ROBOT_CANCELING.ROUTE:
    case RECOVERY_MAP.ROBOT_PICKING_UP_TIPS.ROUTE:
    case RECOVERY_MAP.ROBOT_SKIPPING_STEP.ROUTE:
    case RECOVERY_MAP.ROBOT_RELEASING_LABWARE.ROUTE:
    case RECOVERY_MAP.STACKER_RELEASING_LABWARE_LATCH.ROUTE:
      return buildRecoveryInProgress()
    case RECOVERY_MAP.ROBOT_DOOR_OPEN.ROUTE:
      return buildManuallyRouteToDoorOpen()
    case RECOVERY_MAP.HOME_AND_RETRY.ROUTE:
      return buildHomeAndRetry()
    case RECOVERY_MAP.VACUUM_CARBOY_FULL_RETRY.ROUTE:
      return buildVacuumCarboyFullRetry()
    case RECOVERY_MAP.VACUUM_CARBOY_FULL_SKIP.ROUTE:
      return buildVacuumCarboyFullSkip()
    case RECOVERY_MAP.VACUUM_PRESSURE_NOT_REACHED_RETRY.ROUTE:
      return buildVacuumPressureNotReachedRetry()
    default:
      console.error('route: ' + props.recoveryMap.route + 'was not found')
      return buildSelectRecoveryOption()
  }
}
