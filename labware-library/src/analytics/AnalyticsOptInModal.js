// @flow
import * as React from 'react'
import { ContinueModal } from '@opentrons/components'
import useAnalytics from './useAnalytics'

type Props = {|
  className?: string,
  children: React.Node,
|}

const AnalyticsOptIn = (props: Props) => {
  const { optInToAnalytics, optOutOfAnalytics, analyticsState } = useAnalytics()

  return (
    !analyticsState.seenOptIn && (
      <ContinueModal
        className={props.className}
        onCancelClick={optOutOfAnalytics}
        onContinueClick={optInToAnalytics}
      >
        {props.children}
      </ContinueModal>
    )
  )
}

export default AnalyticsOptIn
