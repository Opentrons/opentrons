// @flow
import * as React from 'react'

import { ScrollableAlertModal } from '../../modals'
import styles from './styles.css'

import type { ButtonProps } from '@opentrons/components'

type Props = {
  notNowButton: ButtonProps,
  viewReleaseNotes: () => mixed,
}

const HEADING = 'Robot System Update Available'
export default function UpdateBuildroot(props: Props) {
  const { notNowButton, viewReleaseNotes } = props

  const buttons: Array<?ButtonProps> = [
    notNowButton,
    {
      children: 'view robot update',
      className: styles.view_update_button,
      onClick: viewReleaseNotes,
    },
  ]

  return (
    <ScrollableAlertModal heading={HEADING} buttons={buttons} alertOverlay>
      <div className={styles.system_update_modal}>
        <p className={styles.system_update_warning}>
          This update is a little different than previous updates.{' '}
        </p>

        <p>
          In addition to delivering new features, this update changes the
          robot’s operating system to improve robot stabillity and support.
        </p>

        <p>
          Please note that this update will take an estimated 10-15 minutes,
          will reboot your robot two times, and requires your OT-2 to remain
          discoverable via USB or Wifi throughout the entire migration process.
        </p>
      </div>
    </ScrollableAlertModal>
  )
}
