// @flow
import * as React from 'react'
import { Nav, Breadcrumbs } from '../../components/Nav'
import { AnalyticsOptInModal } from '../../analytics/AnalyticsOptInModal'
import styles from './LabwareCreator.css'

type Props = {|
  children: React.Node,
|}

export function LabwareCreator(props: Props): React.Node {
  return (
    <>
      <AnalyticsOptInModal className={styles.analytics_modal}>
        <h2>Share sessions with the Opentrons Product Team?</h2>
        <p>
          We’re working to improve the Labware Creator. Part of the process
          involves watching real user sessions to understand which parts of the
          interface are working and which could use improvement as well as
          collecting data on how different parts of the tool are used.
        </p>
        <p>We never share sessions or data outside of Opentrons.</p>
      </AnalyticsOptInModal>
      <Nav />
      <Breadcrumbs />
      <div className={styles.page_wrapper}>{props.children}</div>
    </>
  )
}
