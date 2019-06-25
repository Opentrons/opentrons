// @flow
import * as React from 'react'
import { Link } from 'react-router-dom'
import { AlertModal } from '@opentrons/components'
import styles from './styles.css'

type Props = {
  parentUrl: string,
  ignoreBuildrootUpdate: () => mixed,
}
const HEADING = 'Robot System Update Available'
export default function UpdateBuildroot(props: Props) {
  const { parentUrl, ignoreBuildrootUpdate } = props
  const notNowButton = {
    Component: Link,
    to: parentUrl,
    children: 'not now',
    onClick: ignoreBuildrootUpdate,
  }
  return (
    <AlertModal
      heading={HEADING}
      buttons={[
        notNowButton,
        {
          children: 'view robot update',
          className: styles.view_update_button,
        },
      ]}
      alertOverlay
      contentsClassName={styles.system_update_modal}
    >
      <p className={styles.system_update_warning}>
        This update is a little different than previous updates.{' '}
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
