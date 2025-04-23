import { Trans, useTranslation } from 'react-i18next'
import { LegacyStyledText } from '@opentrons/components'
import { RECOVERY_MAP } from '../constants'
import {
  HoldingLabware,
  ReleaseLabware,
  TwoColLwInfoAndDeck,
  TwoColTextAndFailedStepNextStep,
  RetryStepInfo,
  RecoveryDoorOpenSpecial,
  SkipStepInfo,
} from '../shared'
import { SelectRecoveryOption } from './SelectRecoveryOption'

import type { RecoveryContentProps, RouteStep } from '../types'
import { TwoColTextAndImage } from '../shared/TwoColTextAndImage'

export function ManualReplaceLwAndRetry(
  props: RecoveryContentProps
): JSX.Element {
  const { recoveryMap, doorStatusUtils } = props
  const { step, route } = recoveryMap
  const {
    MANUAL_REPLACE_AND_RETRY,
    MANUAL_REPLACE_STACKER_AND_RETRY,
    MANUAL_LOAD_IN_STACKER_AND_SKIP,
    LOAD_LABWARE_SHUTTLE_AND_RETRY,
    HOPPER_MANUAL_LOAD_AND_RETRY,
    HOPPER_MANUAL_LOAD_ON_SHUTTLE_AND_SKIP,
    ROBOT_IN_MOTION,
    REPLACE_LABWARE_IN_HOPPER_AND_RETRY,
    MANUAL_LOAD_ON_SHUTTLE_AND_SKIP,
  } = RECOVERY_MAP

  const { t } = useTranslation('error_recovery')
  const { routeUpdateActions, recoveryCommands } = props
  const { proceedToRouteAndStep, handleMotionRouting } = routeUpdateActions
  const { homeShuttle } = recoveryCommands

  const primaryBtnOnClick = (): Promise<void> => {
    return handleMotionRouting(true, ROBOT_IN_MOTION.ROUTE).then(() => {
      switch (route) {
        case LOAD_LABWARE_SHUTTLE_AND_RETRY.ROUTE:
        case REPLACE_LABWARE_IN_HOPPER_AND_RETRY.ROUTE:
        case MANUAL_LOAD_ON_SHUTTLE_AND_SKIP.ROUTE:
          void homeShuttle().then(() => {
            proceedToRouteAndStep(route, buildNextStep())
          })
          break
        default:
          proceedToRouteAndStep(route, buildNextStep())
          break
      }
    })
  }

  const buildNextStep = (): RouteStep => {
    if (doorStatusUtils.isDoorOpen) {
      switch (route) {
        case RECOVERY_MAP.MANUAL_REPLACE_STACKER_AND_RETRY.ROUTE:
          return RECOVERY_MAP.MANUAL_REPLACE_STACKER_AND_RETRY.STEPS
            .CLOSE_DOOR_AND_HOME
        default:
          return MANUAL_LOAD_IN_STACKER_AND_SKIP.STEPS.CLOSE_DOOR_AND_HOME
      }
    } else {
      switch (route) {
        case RECOVERY_MAP.MANUAL_REPLACE_STACKER_AND_RETRY.ROUTE:
          return RECOVERY_MAP.MANUAL_REPLACE_STACKER_AND_RETRY.STEPS
            .CONFIRM_RETRY
        case RECOVERY_MAP.LOAD_LABWARE_SHUTTLE_AND_RETRY.ROUTE:
          return RECOVERY_MAP.LOAD_LABWARE_SHUTTLE_AND_RETRY.STEPS
            .MANUAL_REPLACE
        case REPLACE_LABWARE_IN_HOPPER_AND_RETRY.ROUTE:
          return REPLACE_LABWARE_IN_HOPPER_AND_RETRY.STEPS
            .CONFIRM_LABWARE_IN_LATCH
        case MANUAL_LOAD_ON_SHUTTLE_AND_SKIP.ROUTE:
          return MANUAL_LOAD_ON_SHUTTLE_AND_SKIP.STEPS.CONFIRM_LABWARE_IN_LATCH
        default:
          return MANUAL_LOAD_IN_STACKER_AND_SKIP.STEPS.MANUAL_REPLACE
      }
    }
  }

  const buildBodyText = (): JSX.Element => (
    <Trans
      t={t}
      i18nKey="carefully_clear_track"
      components={{ block: <LegacyStyledText as="p" /> }}
    />
  )
  const buildContent = (): JSX.Element => {
    switch (step) {
      case MANUAL_REPLACE_AND_RETRY.STEPS.GRIPPER_HOLDING_LABWARE:
      case REPLACE_LABWARE_IN_HOPPER_AND_RETRY.STEPS.CONFIRM_LABWARE_IN_LATCH:
      case MANUAL_LOAD_ON_SHUTTLE_AND_SKIP.STEPS.CONFIRM_LABWARE_IN_LATCH:
        return <HoldingLabware {...props} />
      case MANUAL_REPLACE_AND_RETRY.STEPS.GRIPPER_RELEASE_LABWARE:
      case REPLACE_LABWARE_IN_HOPPER_AND_RETRY.STEPS.RELEASE_FROM_LATCH:
      case MANUAL_LOAD_ON_SHUTTLE_AND_SKIP.STEPS.RELEASE_FROM_LATCH:
        return <ReleaseLabware {...props} />
      case MANUAL_REPLACE_AND_RETRY.STEPS.CLOSE_DOOR_GRIPPER_Z_HOME:
        return <RecoveryDoorOpenSpecial {...props} />
      case MANUAL_REPLACE_AND_RETRY.STEPS.MANUAL_REPLACE:
      case MANUAL_REPLACE_STACKER_AND_RETRY.STEPS.CONFIRM_RETRY:
      case MANUAL_LOAD_IN_STACKER_AND_SKIP.STEPS.MANUAL_REPLACE:
      case HOPPER_MANUAL_LOAD_AND_RETRY.STEPS.CONFIRM_RETRY:
      case HOPPER_MANUAL_LOAD_ON_SHUTTLE_AND_SKIP.STEPS.HOPPER_MANUAL_REPLACE:
      case REPLACE_LABWARE_IN_HOPPER_AND_RETRY.STEPS.CONFIRM_RETRY:
      case MANUAL_LOAD_ON_SHUTTLE_AND_SKIP.STEPS.CONFIRM_RETRY:
        return <TwoColLwInfoAndDeck {...props} />
      case LOAD_LABWARE_SHUTTLE_AND_RETRY.STEPS.MANUAL_REPLACE:
      case REPLACE_LABWARE_IN_HOPPER_AND_RETRY.STEPS.EMPTY_STACKER:
      case MANUAL_LOAD_ON_SHUTTLE_AND_SKIP.STEPS.EMPTY_STACKER:
      case REPLACE_LABWARE_IN_HOPPER_AND_RETRY.STEPS.REENGAGE_LATCH:
      case MANUAL_LOAD_ON_SHUTTLE_AND_SKIP.STEPS.REENGAGE_LATCH:
        return <TwoColTextAndImage {...props} />
      case MANUAL_REPLACE_STACKER_AND_RETRY.STEPS.PREPARE_TRACK_FOR_HOMING:
      case LOAD_LABWARE_SHUTTLE_AND_RETRY.STEPS.PREPARE_TRACK_FOR_HOMING:
      case REPLACE_LABWARE_IN_HOPPER_AND_RETRY.STEPS.PREPARE_TRACK_FOR_HOMING:
      case MANUAL_LOAD_ON_SHUTTLE_AND_SKIP.STEPS.PREPARE_TRACK_FOR_HOMING:
        return (
          <TwoColTextAndFailedStepNextStep
            {...props}
            leftColTitle={t('prepare_track_for_homing')}
            leftColBodyText={buildBodyText()}
            primaryBtnCopy={t('continue')}
            primaryBtnOnClick={primaryBtnOnClick}
          />
        )
      case HOPPER_MANUAL_LOAD_AND_RETRY.STEPS.RETRY:
      case MANUAL_REPLACE_AND_RETRY.STEPS.RETRY:
      case MANUAL_REPLACE_STACKER_AND_RETRY.STEPS.RETRY:
        return <RetryStepInfo {...props} />
      case MANUAL_LOAD_IN_STACKER_AND_SKIP.STEPS.SKIP:
      case HOPPER_MANUAL_LOAD_ON_SHUTTLE_AND_SKIP.STEPS.SKIP:
      case MANUAL_LOAD_ON_SHUTTLE_AND_SKIP.STEPS.SKIP:
        return <SkipStepInfo {...props} />
      default:
        console.warn(
          `ManualReplaceLwAndRetry: ${step} in ${route} not explicitly handled. Rerouting.`
        )
        return <SelectRecoveryOption {...props} />
    }
  }

  return buildContent()
}
