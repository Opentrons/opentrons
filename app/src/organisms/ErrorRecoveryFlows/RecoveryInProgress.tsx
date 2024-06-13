import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { RECOVERY_MAP } from './constants'

import type { RobotMovingRoute, RecoveryContentProps } from './types'

export function RecoveryInProgress({
  recoveryMap,
}: RecoveryContentProps): JSX.Element {
  const {
    ROBOT_CANCELING,
    ROBOT_IN_MOTION,
    ROBOT_RESUMING,
    ROBOT_RETRYING_STEP,
    ROBOT_PICKING_UP_TIPS,
  } = RECOVERY_MAP
  const { t } = useTranslation('error_recovery')
  const { route } = recoveryMap

  const buildDescription = (): RobotMovingRoute => {
    switch (route) {
      case ROBOT_CANCELING.ROUTE:
        return t('canceling_run')
      case ROBOT_IN_MOTION.ROUTE:
        return t('stand_back')
      case ROBOT_RESUMING.ROUTE:
        return t('stand_back_resuming')
      case ROBOT_RETRYING_STEP.ROUTE:
        return t('stand_back_retrying')
      case ROBOT_PICKING_UP_TIPS.ROUTE:
        return t('stand_back_picking_up_tips')
      default:
        return t('stand_back')
    }
  }

  const description = buildDescription()

  return <InProgressModal description={description} />
}
