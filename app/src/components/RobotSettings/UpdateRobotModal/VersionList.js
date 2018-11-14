// @flow
import * as React from 'react'
import styles from './styles.css'

export type VersionProps = {
  appVersion: string,
  robotVersion: string,
  availableUpdate: string,
}

export default function VersionList (props: VersionProps) {
  return (
    <ol className={styles.version_list}>
      <li>Your current app version: {props.appVersion}</li>
      <li>Your current robot server version: {props.robotVersion}</li>
      <li>Available update: {props.availableUpdate}</li>
    </ol>
  )
}
