// @flow
import * as React from 'react'
import { AlertModal } from '@opentrons/components'
import useAnalyticsOptInOrOut from './useAnalyticsOptInOrOut'

type Props = {|
  className?: string,
  children: React.Node,
|}

const AnalyticsOptInModal = (props: Props) => {
  const { setAnalyticsOptIn, analyticsState } = useAnalyticsOptInOrOut()

  return (
    !analyticsState.seenOptIn && (
      <AlertModal
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

export default AnalyticsOptInModal
