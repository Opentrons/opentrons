// @flow
// app status panel with connect button
import * as React from 'react'
import type {ShellUpdate} from '../../shell'
import {AnalyticsSettingsCard} from '../analytics-settings'
import AdvancedSettingsCard from './AdvancedSettingsCard'
import AppInfoCard from './AppInfoCard'
import AppUpdateModal from './AppUpdateModal'

import styles from './styles.css'

type Props = {
  update: ShellUpdate,
  checkForUpdates: () => mixed,
}

export default function AppSettings (props: Props) {
  return (
    <div className={styles.app_settings}>
      <div className={styles.row}>
        <AppInfoCard {...props}/>
      </div>
      <div className={styles.row}>
        <AnalyticsSettingsCard {...props} />
      </div>
      <div className={styles.row}>
        <AdvancedSettingsCard />
      </div>
    </div>
  )
}

export {AppUpdateModal}
