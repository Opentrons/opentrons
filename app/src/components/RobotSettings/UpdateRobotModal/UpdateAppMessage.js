// @flow
import * as React from 'react'
import styles from './styles.css'
import type {VersionProps} from './VersionList'

export default function UpdateAppMessage (props: VersionProps) {
  const {appVersion, robotVersion} = props
  if (appVersion !== robotVersion) {
    return (
      <p className={styles.sync_message}>
        <strong>A newer version of the robot server is available.</strong> We
        recommend you update your app first <em>before</em> updating your robot
        server to ensure you have received all the latest improvements.
      </p>
    )
  } else {
    return (
      <p className={styles.sync_message}>
        <strong>A newer version of the robot server is available.</strong>
        Please update your app to receive all the latest improvements and robot
        server update.
      </p>
    )
  }
}
