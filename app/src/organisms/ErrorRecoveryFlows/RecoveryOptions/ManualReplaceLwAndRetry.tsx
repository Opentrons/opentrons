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

import type { RecoveryContentProps, RecoveryRoute, RouteStep } from '../types'

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
    ROBOT_IN_MOTION,
    STACKER_SHUTTLE_EMPTY_RETRY,
    STACKER_SHUTTLE_EMPTY_SKIP,
  } = RECOVERY_MAP

  const { t } = useTranslation('error_recovery')
  const { routeUpdateActions, recoveryCommands } = props
  const { proceedToRouteAndStep, handleMotionRouting } = routeUpdateActions
  const { homeShuttle } = recoveryCommands

  const homeShuttleRoutes: RecoveryRoute[] = [
    STACKER_SHUTTLE_MISSING_RETRY.ROUTE,
    STACKER_STALLED_RETRY.ROUTE,
    STACKER_STALLED_SKIP.ROUTE,
  ]

  const primaryBtnOnClick = (): Promise<void> => {
    return handleMotionRouting(true, ROBOT_IN_MOTION.ROUTE).then(() => {
      switch (route) {
        case STACKER_SHUTTLE_MISSING_RETRY.ROUTE:
        case STACKER_SHUTTLE_EMPTY_RETRY.ROUTE:
        case STACKER_STALLED_SKIP.ROUTE:
        case STACKER_SHUTTLE_EMPTY_SKIP.ROUTE:
          if (homeShuttleRoutes.includes(route)) {
            void homeShuttle().then(() => {
              proceedToRouteAndStep(route, buildNextStep())
            })
          } else {
            proceedToRouteAndStep(route, buildNextStep())
          }
          break
        default:
          proceedToRouteAndStep(route, buildNextStep())
          break
      }
    })
  }

  const buildNextStep = (): RouteStep => {
    switch (route) {
      case RECOVERY_MAP.STACKER_STALLED_RETRY.ROUTE:
        return RECOVERY_MAP.STACKER_STALLED_RETRY.STEPS
          .CLEAR_TRACK_OF_OBSTRUCTIONS
      case RECOVERY_MAP.STACKER_SHUTTLE_MISSING_RETRY.ROUTE:
        return RECOVERY_MAP.STACKER_SHUTTLE_MISSING_RETRY.STEPS.MANUAL_REPLACE
      case STACKER_SHUTTLE_EMPTY_RETRY.ROUTE:
        return STACKER_SHUTTLE_EMPTY_RETRY.STEPS
          .CONFIRM_LABWARE_IN_LATCH
      case STACKER_SHUTTLE_EMPTY_SKIP.ROUTE:
        return STACKER_SHUTTLE_EMPTY_SKIP.STEPS.CONFIRM_LABWARE_IN_LATCH
      default:
        return STACKER_STALLED_SKIP.STEPS.CLEAR_TRACK_OF_OBSTRUCTIONS
    }
  }

  const buildTitle = (): string => {
    return t('prepare_track_for_homing')
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
      case STACKER_SHUTTLE_EMPTY_RETRY.STEPS.CONFIRM_LABWARE_IN_LATCH:
      case STACKER_SHUTTLE_EMPTY_SKIP.STEPS.CONFIRM_LABWARE_IN_LATCH:
        return <HoldingLabware {...props} />
      case MANUAL_REPLACE_AND_RETRY.STEPS.GRIPPER_RELEASE_LABWARE:
      case STACKER_SHUTTLE_EMPTY_RETRY.STEPS.RELEASE_FROM_LATCH:
      case STACKER_SHUTTLE_EMPTY_SKIP.STEPS.RELEASE_FROM_LATCH:
        return <ReleaseLabware {...props} />
      case MANUAL_REPLACE_AND_RETRY.STEPS.CLOSE_DOOR_GRIPPER_Z_HOME:
        return <RecoveryDoorOpenSpecial {...props} />
      case MANUAL_REPLACE_AND_RETRY.STEPS.MANUAL_REPLACE:
      case STACKER_STALLED_RETRY.STEPS.CONFIRM_RETRY:
      case STACKER_STALLED_SKIP.STEPS.MANUAL_REPLACE:
      case STACKER_HOPPER_EMPTY_RETRY.STEPS.CONFIRM_RETRY:
      case STACKER_HOPPER_EMPTY_SKIP.STEPS.HOPPER_MANUAL_REPLACE:
      case STACKER_SHUTTLE_EMPTY_RETRY.STEPS.CONFIRM_RETRY:
      case STACKER_SHUTTLE_EMPTY_SKIP.STEPS.CONFIRM_RETRY:
        return <TwoColLwInfoAndDeck {...props} />
      case STACKER_SHUTTLE_MISSING_RETRY.STEPS.MANUAL_REPLACE:
      case STACKER_STALLED_RETRY.STEPS.CLEAR_TRACK_OF_OBSTRUCTIONS:
      case STACKER_SHUTTLE_EMPTY_RETRY.STEPS.EMPTY_STACKER:
      case STACKER_SHUTTLE_EMPTY_SKIP.STEPS.EMPTY_STACKER:
      case STACKER_SHUTTLE_EMPTY_RETRY.STEPS.REENGAGE_LATCH:
      case STACKER_SHUTTLE_EMPTY_SKIP.STEPS.REENGAGE_LATCH:
        return <TwoColTextAndImage {...props} />
      case STACKER_STALLED_RETRY.STEPS.PREPARE_TRACK_FOR_HOMING:
      case STACKER_SHUTTLE_MISSING_RETRY.STEPS.PREPARE_TRACK_FOR_HOMING:
      case STACKER_SHUTTLE_EMPTY_RETRY.STEPS.PREPARE_TRACK_FOR_HOMING:
      case STACKER_SHUTTLE_EMPTY_SKIP.STEPS.PREPARE_TRACK_FOR_HOMING:
        return (
          <TwoColTextAndFailedStepNextStep
            {...props}
            leftColTitle={buildTitle()}
            leftColBodyText={buildBodyText()}
            primaryBtnCopy={t('home_now')}
            primaryBtnOnClick={primaryBtnOnClick}
          />
        )
      case STACKER_HOPPER_EMPTY_RETRY.STEPS.RETRY:
      case MANUAL_REPLACE_AND_RETRY.STEPS.RETRY:
      case STACKER_STALLED_RETRY.STEPS.RETRY:
        return <RetryStepInfo {...props} />
      case STACKER_STALLED_SKIP.STEPS.SKIP:
      case STACKER_HOPPER_EMPTY_SKIP.STEPS.SKIP:
      case STACKER_SHUTTLE_EMPTY_SKIP.STEPS.SKIP:
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
