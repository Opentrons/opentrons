// @flow
import * as React from 'react'

import LostConnectionAlert from '../LostConnectionAlert'
import {AnalyticsSettingsModal} from '../analytics-settings'

import styles from './styles.css'

type Props = {
  children: React.Node,
}
export default function PageWrapper (props: Props) {
  return (
    <div className={styles.relative}>
      {props.children}
      <LostConnectionAlert />
      <AnalyticsSettingsModal />
    </div>
  )
}
