import { RECOVERY_MAP } from '../constants'
import { SkipStepInfo } from '../shared'
import { SelectRecoveryOption } from './SelectRecoveryOption'

import type { ReactNode } from 'react'
import type { RecoveryContentProps } from '../types'

export function SkipStepSameTips(props: RecoveryContentProps): ReactNode {
  const { recoveryMap } = props
  const { step, route } = recoveryMap
  const { SKIP_STEP_WITH_SAME_TIPS } = RECOVERY_MAP

  const buildContent = (): JSX.Element => {
    switch (step) {
      case SKIP_STEP_WITH_SAME_TIPS.STEPS.SKIP:
        return <SkipStepInfo {...props} />
      default:
        console.warn(
          `SkipStepSameTips: ${step} in ${route} not explicitly handled. Rerouting.`
        )
        return <SelectRecoveryOption {...props} />
    }
  }

  return buildContent()
}
