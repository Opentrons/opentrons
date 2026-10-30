import { RECOVERY_MAP } from '../constants'
import { RetryWithNewTips, SelectTips, TwoColLwInfoAndDeck } from '../shared'
import { SelectRecoveryOption } from './SelectRecoveryOption'

import type { ReactNode } from 'react'
import type { RecoveryContentProps } from '../types'

export function RetryNewTips(props: RecoveryContentProps): ReactNode {
  const { recoveryMap, routeUpdateActions } = props
  const { step, route } = recoveryMap
  const { RETRY_NEW_TIPS, DROP_TIP_FLOWS } = RECOVERY_MAP

  // Do this instead of directly routing to DropTipFlows route first,
  // so SelectRecoveryOptions labels this route as the selected recovery option.
  if (step === RETRY_NEW_TIPS.STEPS.DROP_TIPS) {
    void routeUpdateActions.proceedToRouteAndStep(
      DROP_TIP_FLOWS.ROUTE,
      DROP_TIP_FLOWS.STEPS.BEFORE_BEGINNING
    )
  }

  const buildContent = (): JSX.Element => {
    switch (step) {
      case RETRY_NEW_TIPS.STEPS.REPLACE_TIPS:
        return <TwoColLwInfoAndDeck {...props} />
      case RETRY_NEW_TIPS.STEPS.SELECT_TIPS:
        return <SelectTips {...props} />
      case RETRY_NEW_TIPS.STEPS.RETRY:
        return <RetryWithNewTips {...props} />
      default:
        console.warn(
          `RetryNewTips: ${step} in ${route} not explicitly handled. Rerouting.`
        )
        return <SelectRecoveryOption {...props} />
    }
  }

  return buildContent()
}
