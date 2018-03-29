// @flow
// app status panel with connect button
import * as React from 'react'

import type {ShellUpdate} from '../../shell'
import AppInfoCard from './AppInfoCard'
import AppUpdateModal from './AppUpdateModal'

import styles from './styles.css'

type Props = ShellUpdate & {
  checkForUpdates: () => mixed
}

export default function AppSettings (props: Props) {
  return (
    <div className={styles.app_settings}>
      <AppInfoCard {...props} />
    </div>
  )
}

export {AppUpdateModal}
