// @flow
import * as React from 'react'
import { AlertModal } from '@opentrons/components'
import styles from './styles.css'

type Props = {
  ignoreUpdate: () => mixed,
  viewUpdate: () => mixed,
}

const HEADING = 'Robot System Update Available'
export default function UpdateBuildroot(props: Props) {
  const { ignoreUpdate, viewUpdate } = props
  return (
    <AlertModal
      heading={HEADING}
      buttons={[
        { children: 'not now', onClick: ignoreUpdate },
        {
          children: 'view robot update',
          onClick: viewUpdate,
          className: styles.view_update_button,
        },
      ]}
      alertOverlay
      contentsClassName={styles.system_update_modal}
    >
      <p className={styles.system_update_warning}>
        This update is a little different than previous updates.
      </p>

      <p>
        In addition to delivering new features, this update changes the robot’s
        operating system to improve robot stabillity and support.
      </p>

      <p>
        Please note that this update will take an estimated 10-15 minutes, will
        reboot your robot two times, and requires your OT-2 to remain
        discoverable via USB or Wifi throughout the entire migration process.
      </p>
    </AlertModal>
  )
}
