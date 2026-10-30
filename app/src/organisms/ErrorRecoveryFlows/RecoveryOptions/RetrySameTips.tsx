import { RetryWithSameTips } from '/app/organisms/ErrorRecoveryFlows/shared'

import { RECOVERY_MAP } from '../constants'
import { SelectRecoveryOption } from './SelectRecoveryOption'

import type { ReactNode } from 'react'
import type { RecoveryContentProps } from '../types'

export function RetrySameTips(props: RecoveryContentProps): ReactNode {
  const { recoveryMap } = props
  const { step, route } = recoveryMap
  const { RETRY_SAME_TIPS } = RECOVERY_MAP

  const buildContent = (): JSX.Element => {
    switch (step) {
      case RETRY_SAME_TIPS.STEPS.RETRY:
        return <RetryWithSameTips {...props} />
      default:
        console.warn(
          `RetrySameTips: ${step} in ${route} not explicitly handled. Rerouting.`
        )
        return <SelectRecoveryOption {...props} />
    }
  }

  return buildContent()
}
