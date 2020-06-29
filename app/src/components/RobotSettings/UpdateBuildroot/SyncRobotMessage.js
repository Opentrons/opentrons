// @flow
import * as React from 'react'

import { DOWNGRADE, REINSTALL, UPGRADE } from '../../../buildroot'
import type { BuildrootUpdateType } from '../../../buildroot/types'
import styles from './styles.css'

export type SyncRobotMessageProps = {|
  updateType: BuildrootUpdateType,
  version: string,
|}

export function SyncRobotMessage(props: SyncRobotMessageProps): React.Node {
  const { updateType, version } = props

  if (updateType === REINSTALL) return null

  return (
    <p className={styles.sync_message}>
      <strong>
        Your robot software version and app version are out of sync. <br />
      </strong>
      {updateType === UPGRADE && (
        <>
          For an optimal experience, we recommend you upgrade your robot
          software to {version} match your app.
        </>
      )}
      {updateType === DOWNGRADE && (
        <>
          You may wish to downgrade to robot software version {version} to
          ensure compatibility.
        </>
      )}
    </p>
  )
}
