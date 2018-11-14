// @flow
import * as React from 'react'
import styles from './styles.css'
import type {VersionProps} from './types.js'
type Props = {
  ...$Exact<VersionProps>,
  onClick: () => mixed,
}

const SKIP_APP_MESSAGE =
  'If you wish to skip this app update and only sync your robot server with your current app version, please '
export default function SkipAppUpdateMessage (props: Props) {
  const {appVersion, robotVersion} = props
  if (appVersion === robotVersion) return null
  return (
    <p className={styles.sync_message}>
      {SKIP_APP_MESSAGE}
      <a className={styles.sync_link} onClick={props.onClick}>
        click here
      </a>.
    </p>
  )
}
