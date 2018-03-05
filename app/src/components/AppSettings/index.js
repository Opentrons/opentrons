// @flow
// app status panel with connect button
import * as React from 'react'
import AppInfoCard from './AppInfoCard'
import AppUpdateModal from './AppUpdateModal'

import styles from './styles.css'

export default function AppInfo () {
  return (
    <div className={styles.app_settings}>
      <AppInfoCard />
    </div>
  )
}

export {AppUpdateModal}
