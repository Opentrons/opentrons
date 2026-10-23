import { RECOVERY_MAP } from '../constants'
import {
  FillWell,
  RetryWithNewTips,
  SelectTips,
  TwoColLwInfoAndDeck,
} from '../shared'
import { CancelRun } from './CancelRun'
import { SelectRecoveryOption } from './SelectRecoveryOption'

import type { ReactNode } from 'react'
import type { RecoveryContentProps } from '../types'

export function FillWellAndRetryNewTips(
  props: RecoveryContentProps
): ReactNode {
  const { recoveryMap, routeUpdateActions } = props
  const { step, route } = recoveryMap
  const { MANUAL_FILL_AND_RETRY_NEW_TIPS, DROP_TIP_FLOWS, CANCEL_RUN } =
    RECOVERY_MAP

  if (step === MANUAL_FILL_AND_RETRY_NEW_TIPS.STEPS.DROP_TIPS) {
    void routeUpdateActions.proceedToRouteAndStep(
      DROP_TIP_FLOWS.ROUTE,
      DROP_TIP_FLOWS.STEPS.BEFORE_BEGINNING
    )
  }

  const buildContent = (): JSX.Element => {
    switch (step) {
      case MANUAL_FILL_AND_RETRY_NEW_TIPS.STEPS.MANUAL_FILL:
        return <FillWell {...props} />
      case MANUAL_FILL_AND_RETRY_NEW_TIPS.STEPS.REPLACE_TIPS:
        return <TwoColLwInfoAndDeck {...props} />
      case MANUAL_FILL_AND_RETRY_NEW_TIPS.STEPS.SELECT_TIPS:
        return <SelectTips {...props} />
      case MANUAL_FILL_AND_RETRY_NEW_TIPS.STEPS.RETRY:
        return <RetryWithNewTips {...props} />
      case CANCEL_RUN.STEPS.CONFIRM_CANCEL:
        return <CancelRun {...props} />
      default:
        console.warn(
          `FillWellAndRetryNewTips: ${step} in ${route} not explicitly handled. Rerouting.`
        )
        return <SelectRecoveryOption {...props} />
    }
  }

  return buildContent()
}
