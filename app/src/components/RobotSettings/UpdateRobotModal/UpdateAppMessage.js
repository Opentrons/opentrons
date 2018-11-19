// @flow
import * as React from 'react'
import semver from 'semver'
import styles from './styles.css'
import type {VersionProps} from './types.js'

const NEWER_VERSION = (
  <strong>A newer version of the robot server is available.</strong>
)
const RECOMMEND_UPDATE_APP_FIRST = (
  <React.Fragment>
    We recommend you update your app first <em>before</em> updating your robot
    server to ensure you have received all the latest improvements.
  </React.Fragment>
)
const UPDATE_APP = (
  <React.Fragment>
    Please update your app to receive all the latest improvements and robot
    server update.
  </React.Fragment>
)

export default function UpdateAppMessage (props: VersionProps) {
  const {appVersion, robotVersion} = props
  const versionsMatch = semver.eq(appVersion, robotVersion)

  return (
    <p className={styles.sync_message}>
      {NEWER_VERSION}
      <br />
      {!versionsMatch ? RECOMMEND_UPDATE_APP_FIRST : UPDATE_APP}
    </p>
  )
}
