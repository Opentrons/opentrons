// @flow
import * as React from 'react'
import styles from './styles.css'
import type { BuildrootUpdateType } from '../../../buildroot/types'

type Props = {|
  updateType: BuildrootUpdateType,
  version: string,
|}

export default function SyncRobotMessage(props: Props) {
  const { updateType, version } = props

  if (updateType === 'reinstall') return null

  return (
    <p className={styles.sync_message}>
      <strong>
        Your robot software version and app version are out of sync. <br />
      </strong>
      {updateType === 'upgrade' && (
        <>
          For an optimal experience, we recommend you upgrade your robot
          software to {version} match your app.
        </>
      )}
      {updateType === 'downgrade' && (
        <>
          You may wish to downgrade to robot software version {version} to
          ensure compatibility.
        </>
      )}
    </p>
  )
}
