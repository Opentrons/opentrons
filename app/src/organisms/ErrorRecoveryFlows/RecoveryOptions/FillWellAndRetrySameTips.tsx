import { RECOVERY_MAP } from '../constants'
import { CancelRun } from './CancelRun'
import { FillWell, RetryWithSameTips } from '../shared'
import { SelectRecoveryOption } from './SelectRecoveryOption'

import type { RecoveryContentProps } from '../types'

export function FillWellAndRetrySameTips(
  props: RecoveryContentProps
): JSX.Element {
  const { recoveryMap } = props
  const { step, route } = recoveryMap
  const { MANUAL_FILL_AND_RETRY_SAME_TIPS, CANCEL_RUN } = RECOVERY_MAP

  const buildContent = (): JSX.Element => {
    switch (step) {
      case MANUAL_FILL_AND_RETRY_SAME_TIPS.STEPS.MANUAL_FILL:
        return <FillWell {...props} />
      case MANUAL_FILL_AND_RETRY_SAME_TIPS.STEPS.RETRY_SAME_TIPS:
        return <RetryWithSameTips {...props} />
      case CANCEL_RUN.STEPS.CONFIRM_CANCEL:
        return <CancelRun {...props} />
      default:
        console.warn(
          `FillWellAndRetrySameTips: ${step} in ${route} not explicitly handled. Rerouting.`
        )
        return <SelectRecoveryOption {...props} />
    }
  }

  return buildContent()
}
