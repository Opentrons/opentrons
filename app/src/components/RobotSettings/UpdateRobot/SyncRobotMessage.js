// @flow
import * as React from 'react'
import styles from './styles.css'
import type { RobotUpdateInfo } from '../../../http-api-client'
type Props = {
  updateInfo: RobotUpdateInfo,
}

const notSyncedMessage = (
  <strong>
    Your robot server version and app version are out of sync. <br />
  </strong>
)

export default function SyncRobotMessage(props: Props) {
  const {
    updateInfo: { type, version },
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
        You may wish to downgrade to robot server version {version} to ensure
        compatibility.
      </p>
    )
  }
  return null
}
