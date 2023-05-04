import { useAnalyticsOptInOrOut } from './useAnalyticsOptInOrOut'
import { AlertModal } from '@opentrons/components'
import * as React from 'react'

interface Props {
  className?: string
  children: React.ReactNode
}

export const AnalyticsOptInModal = (props: Props): JSX.Element | null => {
  const { setAnalyticsOptIn, analyticsState } = useAnalyticsOptInOrOut()
  if (analyticsState.seenOptIn) return null

  return (
    <AlertModal
      restrictOuterScroll={false}
      className={props.className}
      buttons={[
        { onClick: () => setAnalyticsOptIn(false), children: 'NO' },
        { onClick: () => setAnalyticsOptIn(true), children: 'YES' },
      ]}
    >
      {props.children}
    </AlertModal>
  )
}
