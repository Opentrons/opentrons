// @flow
import * as React from 'react'
import styles from './styles.css'
import type {VersionProps} from './VersionList'
type Props = VersionProps & {
  onClick: () => mixed,
}
export default function SkipAppUpdateMessage (props: Props) {
  const {appVersion, robotVersion} = props
  if (appVersion === robotVersion) return null
  return (
    <p className={styles.sync_message}>
      If you wish to skip this app update and only sync your robot server with
      your current app version, please{' '}
      <a className={styles.sync_link} onClick={props.onClick}>
        click here
      </a>.
    </p>
  )
}
