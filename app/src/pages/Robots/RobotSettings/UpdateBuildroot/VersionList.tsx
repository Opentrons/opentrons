import * as React from 'react'
import styles from './styles.css'
import type { VersionProps } from './types'

export function VersionList(props: VersionProps): JSX.Element {
  return (
    <ol className={styles.version_list}>
      <li>Your current app version: {props.appVersion}</li>
      <li>
        Your current robot server version: {props.robotVersion || 'Unknown'}
      </li>
      <li>Latest available version: {props.availableUpdate}</li>
    </ol>
  )
}
