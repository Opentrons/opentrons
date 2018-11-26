// @flow
import * as React from 'react'
import styles from './styles.css'
import type {RobotUpdateInfo} from '../../../http-api-client'
type Props = {
  updateInfo: RobotUpdateInfo,
  appVersion: string,
}

const notSyncedMessage = (
  <strong>
    Your robot server version and app version are out of sync. <br />
  </strong>
)

export default function SyncRobotMessage (props: Props) {
  const {
    appVersion,
    updateInfo: {type},
  } = props

  if (type === 'upgrade') {
    return (
      <p className={styles.sync_message}>
        {notSyncedMessage}
        For optimal experience, we recommend you upgrade your robot server
        version to match the app version.
      </p>
    )
  }
  if (type === 'downgrade') {
    return (
      <p className={styles.sync_message}>
        {notSyncedMessage}
        You may wish to downgrade to robot server version {appVersion} to ensure
        compatibility.
      </p>
    )
  }
  return null
}

const REINSTALL_MESSAGE =
  "It looks like your robot is already up to date, but if you're experiencing issues you can re-apply the latest update."

export function ReinstallMessage () {
  return <p className={styles.sync_message}>{REINSTALL_MESSAGE}</p>
}
