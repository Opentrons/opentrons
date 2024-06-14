import * as React from 'react'

import { RECOVERY_MAP } from '../constants'
import { ReplaceTips, SelectTips, RetryWithNewTips } from '../shared'

import type { RecoveryContentProps } from '../types'

export function RetryNewTips(props: RecoveryContentProps): JSX.Element | null {
  const { recoveryMap } = props

  const buildContent = (): JSX.Element | null => {
    const { RETRY_NEW_TIPS } = RECOVERY_MAP
    const { step } = recoveryMap

    switch (step) {
      case RETRY_NEW_TIPS.STEPS.REPLACE_TIPS:
        return <ReplaceTips {...props} />
      case RETRY_NEW_TIPS.STEPS.SELECT_TIPS:
        return <SelectTips {...props} />
      case RETRY_NEW_TIPS.STEPS.RETRY:
        return <RetryWithNewTips {...props} />
      default:
        return <ReplaceTips {...props} />
    }
  }

  return buildContent()
}
