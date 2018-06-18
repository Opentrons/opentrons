// task component
import React from 'react'

import styles from './Page.css'
import LostConnectionAlert from './LostConnectionAlert'
import {AnalyticsSettingsModal} from './analytics-settings'

export default function Page (props) {
  return (
    <main className={styles.task}>
      {props.children}
      <LostConnectionAlert />
      <AnalyticsSettingsModal />
    </main>
  )
}
