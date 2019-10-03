// @flow
import * as React from 'react'
import { ContinueModal } from '@opentrons/components'
import {
  getAnalyticsState,
  initializeAnalytics,
  optInToAnalytics,
  optOutOfAnalytics,
} from '../../analytics'
import Nav, { Breadcrumbs } from '../../components/Nav'
import styles from './LabwareCreator.css'

type Props = {|
  children: React.Node,
|}

const AnalyticsOptIn = () => {
  React.useEffect(() => {
    initializeAnalytics()
  }, [])
  const analyticsState = getAnalyticsState()
  console.log('modal sees', analyticsState)
  const { seenOptIn } = analyticsState

  return (
    !seenOptIn && (
      <ContinueModal
        onCancelClick={optOutOfAnalytics}
        onContinueClick={optInToAnalytics}
      >
        Wanna do some analytics?
      </ContinueModal>
    )
  )
}

export default function LabwareCreator(props: Props) {
  return (
    <>
      <AnalyticsOptIn />
      <Nav />
      <Breadcrumbs />
      <div className={styles.page_wrapper}>{props.children}</div>
    </>
  )
}
