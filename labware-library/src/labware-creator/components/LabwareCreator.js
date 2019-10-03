// @flow
import * as React from 'react'
import Nav, { Breadcrumbs } from '../../components/Nav'
import AnalyticsOptInModal from '../../analytics/AnalyticsOptInModal'
import styles from './LabwareCreator.css'

type Props = {|
  children: React.Node,
|}

export default function LabwareCreator(props: Props) {
  return (
    <>
      <AnalyticsOptInModal className={styles.analytics_modal}>
        Opt in to analytics? COPY GOES HERE
      </AnalyticsOptInModal>
      <Nav />
      <Breadcrumbs />
      <div className={styles.page_wrapper}>{props.children}</div>
    </>
  )
}
