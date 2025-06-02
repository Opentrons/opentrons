import { Trans, useTranslation } from 'react-i18next'

import { LegacyStyledText } from '@opentrons/components'

import { RECOVERY_MAP } from '../constants'
import {
  HoldingLabware,
  RecoveryDoorOpenSpecial,
  ReleaseLabware,
  RetryStepInfo,
  SkipStepInfo,
  TwoColLwInfoAndDeck,
  TwoColTextAndFailedStepNextStep,
} from '../shared'
import { TwoColTextAndImage } from '../shared/TwoColTextAndImage'
import { SelectRecoveryOption } from './SelectRecoveryOption'

import type { RecoveryContentProps, RouteStep } from '../types'

export function ManualReplaceLwAndRetry(
  props: RecoveryContentProps
): JSX.Element {
  const { recoveryMap } = props
  const { step, route } = recoveryMap
  const {
    MANUAL_REPLACE_AND_RETRY,
    STACKER_STALLED_RETRY,
    STACKER_STALLED_SKIP,
    STACKER_SHUTTLE_MISSING_RETRY,
    STACKER_HOPPER_EMPTY_RETRY,
    STACKER_HOPPER_EMPTY_SKIP,
    STACKER_SHUTTLE_EMPTY_RETRY,
    STACKER_SHUTTLE_EMPTY_SKIP,
  } = RECOVERY_MAP

  const buildUnexpectedStep = (): JSX.Element => {
    console.warn(
      `ManualReplaceLwAndRetry: ${step} in ${route} not explicitly handled. Rerouting.`
    )
    return <SelectRecoveryOption {...props} />
  }

  const buildManualReplaceLwAndRetry = (): JSX.Element => {
    switch (step) {
      case MANUAL_REPLACE_AND_RETRY.STEPS.GRIPPER_HOLDING_LABWARE:
        return <HoldingLabware {...props} />
      case MANUAL_REPLACE_AND_RETRY.STEPS.GRIPPER_RELEASE_LABWARE:
        return <ReleaseLabware {...props} />
      case MANUAL_REPLACE_AND_RETRY.STEPS.CLOSE_DOOR_GRIPPER_Z_HOME:
        return <RecoveryDoorOpenSpecial {...props} />
      case MANUAL_REPLACE_AND_RETRY.STEPS.MANUAL_REPLACE:
        return <TwoColLwInfoAndDeck {...props} />
      case MANUAL_REPLACE_AND_RETRY.STEPS.RETRY:
        return <RetryStepInfo {...props} />
      default:
        return buildUnexpectedStep()
    }
  }

  const buildStackerContent = (): JSX.Element => {
    switch (step) {
      case STACKER_STALLED_RETRY.STEPS.PREPARE_TRACK_FOR_HOMING:
      case STACKER_STALLED_SKIP.STEPS.PREPARE_TRACK_FOR_HOMING:
      case STACKER_SHUTTLE_MISSING_RETRY.STEPS.PREPARE_TRACK_FOR_HOMING:
      case STACKER_SHUTTLE_EMPTY_RETRY.STEPS.PREPARE_TRACK_FOR_HOMING:
      case STACKER_SHUTTLE_EMPTY_SKIP.STEPS.PREPARE_TRACK_FOR_HOMING:
        return <PrepareStackerHomeStep {...props} />
      case STACKER_STALLED_RETRY.STEPS.CLEAR_TRACK_OF_OBSTRUCTIONS:
      case STACKER_STALLED_SKIP.STEPS.CLEAR_TRACK_OF_OBSTRUCTIONS:
      case STACKER_STALLED_SKIP.STEPS.MANUAL_REPLACE:
      case STACKER_SHUTTLE_MISSING_RETRY.STEPS.MANUAL_REPLACE:
      case STACKER_HOPPER_EMPTY_SKIP.STEPS.HOPPER_MANUAL_REPLACE:
      case STACKER_SHUTTLE_EMPTY_RETRY.STEPS.EMPTY_STACKER:
      case STACKER_SHUTTLE_EMPTY_RETRY.STEPS.REENGAGE_LATCH:
      case STACKER_SHUTTLE_EMPTY_SKIP.STEPS.EMPTY_STACKER:
      case STACKER_SHUTTLE_EMPTY_SKIP.STEPS.REENGAGE_LATCH:
        return <TwoColTextAndImage {...props} />
      case STACKER_STALLED_RETRY.STEPS.CONFIRM_RETRY:
      case STACKER_STALLED_SKIP.STEPS.CONFIRM_RETRY:
      case STACKER_SHUTTLE_MISSING_RETRY.STEPS.CONFIRM_RETRY:
      case STACKER_HOPPER_EMPTY_RETRY.STEPS.CONFIRM_RETRY:
      case STACKER_HOPPER_EMPTY_SKIP.STEPS.CONFIRM_RETRY:
      case STACKER_SHUTTLE_EMPTY_RETRY.STEPS.CONFIRM_RETRY:
      case STACKER_SHUTTLE_EMPTY_SKIP.STEPS.CONFIRM_RETRY:
        return <TwoColLwInfoAndDeck {...props} />
      case STACKER_STALLED_RETRY.STEPS.RETRY:
      case STACKER_SHUTTLE_MISSING_RETRY.STEPS.RETRY:
      case STACKER_HOPPER_EMPTY_RETRY.STEPS.RETRY:
      case STACKER_SHUTTLE_EMPTY_RETRY.STEPS.RETRY:
        return <RetryStepInfo {...props} />
      case STACKER_STALLED_SKIP.STEPS.SKIP:
      case STACKER_HOPPER_EMPTY_SKIP.STEPS.SKIP:
      case STACKER_SHUTTLE_EMPTY_SKIP.STEPS.SKIP:
        return <SkipStepInfo {...props} />
      case STACKER_SHUTTLE_EMPTY_RETRY.STEPS.CONFIRM_LABWARE_IN_LATCH:
      case STACKER_SHUTTLE_EMPTY_SKIP.STEPS.CONFIRM_LABWARE_IN_LATCH:
        return <HoldingLabware {...props} />
      case STACKER_SHUTTLE_EMPTY_RETRY.STEPS.RELEASE_FROM_LATCH:
      case STACKER_SHUTTLE_EMPTY_SKIP.STEPS.RELEASE_FROM_LATCH:
        return <ReleaseLabware {...props} />
      default:
        return buildUnexpectedStep()
    }
  }

  const buildContent = (): JSX.Element => {
    if (route === RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.ROUTE) {
      return buildManualReplaceLwAndRetry()
    }
    return buildStackerContent()
  }

  return buildContent()
}

export function PrepareStackerHomeStep(
  props: RecoveryContentProps
): JSX.Element {
  const { t } = useTranslation('error_recovery')
  const { recoveryMap } = props
  const { route } = recoveryMap

  const {
    ROBOT_IN_MOTION,
    STACKER_STALLED_SKIP,
    STACKER_SHUTTLE_EMPTY_RETRY,
    STACKER_SHUTTLE_EMPTY_SKIP,
  } = RECOVERY_MAP

  const { routeUpdateActions, recoveryCommands } = props
  const { proceedToRouteAndStep, handleMotionRouting } = routeUpdateActions
  const { homeShuttle } = recoveryCommands

  const buildNextStep = (): RouteStep => {
    switch (route) {
      case RECOVERY_MAP.STACKER_STALLED_RETRY.ROUTE:
        return RECOVERY_MAP.STACKER_STALLED_RETRY.STEPS
          .CLEAR_TRACK_OF_OBSTRUCTIONS
      case RECOVERY_MAP.STACKER_SHUTTLE_MISSING_RETRY.ROUTE:
        return RECOVERY_MAP.STACKER_SHUTTLE_MISSING_RETRY.STEPS.MANUAL_REPLACE
      case STACKER_SHUTTLE_EMPTY_RETRY.ROUTE:
        return STACKER_SHUTTLE_EMPTY_RETRY.STEPS.CONFIRM_LABWARE_IN_LATCH
      case STACKER_SHUTTLE_EMPTY_SKIP.ROUTE:
        return STACKER_SHUTTLE_EMPTY_SKIP.STEPS.CONFIRM_LABWARE_IN_LATCH
      default:
        return STACKER_STALLED_SKIP.STEPS.CLEAR_TRACK_OF_OBSTRUCTIONS
    }
  }
  const buildBodyText = (): JSX.Element => (
    <Trans
      t={t}
      i18nKey="carefully_clear_track"
      components={{ block: <LegacyStyledText as="p" /> }}
    />
  )
  const primaryBtnOnClick = (): Promise<void> => {
    return handleMotionRouting(true, ROBOT_IN_MOTION.ROUTE).then(() => {
      void homeShuttle().then(() => {
        proceedToRouteAndStep(route, buildNextStep())
      })
    })
  }
  return (
    <TwoColTextAndFailedStepNextStep
      {...props}
      leftColTitle={t('prepare_track_for_homing')}
      leftColBodyText={buildBodyText()}
      primaryBtnCopy={t('home_now')}
      primaryBtnOnClick={primaryBtnOnClick}
    />
  )
}
