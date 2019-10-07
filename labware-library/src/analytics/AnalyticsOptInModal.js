// @flow
import * as React from 'react'
import { AlertModal } from '@opentrons/components'
import useAnalyticsOptInOrOut from './useAnalyticsOptInOrOut'

type Props = {|
  className?: string,
  children: React.Node,
|}

const AnalyticsOptIn = (props: Props) => {
  const {
    optInToAnalytics,
    optOutOfAnalytics,
    analyticsState,
  } = useAnalyticsOptInOrOut()

  return (
    !analyticsState.seenOptIn && (
      <AlertModal
        className={props.className}
        buttons={[
          { onClick: optOutOfAnalytics, children: 'NO' },
          { onClick: optInToAnalytics, children: 'YES' },
        ]}
      >
        {props.children}
      </AlertModal>
    )
  )
}

export default AnalyticsOptIn
