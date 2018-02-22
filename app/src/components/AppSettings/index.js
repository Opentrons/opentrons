// @flow
// app status panel with connect button
import * as React from 'react'
import AppInfoCard from './AppInfoCard'
import styles from './styles.css'

export default function AppSettings () {
  return (
    <div className={styles.app_settings}>
      <AppInfoCard />
    </div>
  )
}
