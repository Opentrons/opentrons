// @flow
import * as React from 'react'
import { AlertModal } from '@opentrons/components'
import { useAnalyticsOptInOrOut } from './useAnalyticsOptInOrOut'

type Props = {|
  className?: string,
  children: React.Node,
|}

export const AnalyticsOptInModal = (props: Props): React.Node => {
  const { setAnalyticsOptIn, analyticsState } = useAnalyticsOptInOrOut()

  return (
    !analyticsState.seenOptIn && (
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
  )
}
