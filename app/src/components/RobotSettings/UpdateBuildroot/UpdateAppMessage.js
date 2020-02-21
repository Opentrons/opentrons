// @flow
import * as React from 'react'
import semver from 'semver'
import styles from './styles.css'
import type { VersionProps } from './types'

const NEWER_VERSION = (
  <strong>A newer version of the robot server is available.</strong>
)
const RECOMMEND_UPDATE_APP_FIRST = (
  <>
    We recommend you update your app first <em>before</em> updating your robot
    server to ensure you have received all the latest improvements.
  </>
)
const UPDATE_APP = (
  <>
    Please update your app to receive all the latest improvements and robot
    server update.
  </>
)

export function UpdateAppMessage(props: VersionProps) {
  const { appVersion, availableUpdate } = props
  const versionsMatch: boolean =
    semver.valid(appVersion) && semver.valid(availableUpdate)
      ? semver.eq(appVersion, availableUpdate)
      : false

  return (
    <p className={styles.sync_message}>
      {NEWER_VERSION}
      <br />
      {!versionsMatch ? RECOMMEND_UPDATE_APP_FIRST : UPDATE_APP}
    </p>
  )
}
