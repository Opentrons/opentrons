// @flow
import * as React from 'react'
import { Link } from 'react-router-dom'

import { ScrollableAlertModal } from '../../modals'
import ReleaseNotes from '../../ReleaseNotes'
import { BUILDROOT_RELEASE_NOTES } from '../../../shell'
import styles from './styles.css'

import type { ButtonProps } from '@opentrons/components'

type Props = {
  parentUrl: string,
  ignoreUpdate: () => mixed,
}
const HEADING = 'Robot System Update Available'
export default function UpdateBuildroot(props: Props) {
  const [showReleaseNotes, setShowReleaseNotes] = React.useState<boolean>(false)
  const viewReleaseNotes = () => setShowReleaseNotes(true)
  console.log(BUILDROOT_RELEASE_NOTES)
  const { parentUrl, ignoreUpdate } = props
  const notNowButton = {
    Component: Link,
    to: parentUrl,
    children: 'not now',
    onClick: ignoreUpdate,
  }
  let buttons: Array<?ButtonProps>

  if (showReleaseNotes) {
    buttons = [
      notNowButton,
      {
        children: 'upgrade',
        className: styles.view_update_button,
        disabled: true,
      },
    ]
  } else {
    buttons = [
      notNowButton,
      {
        children: 'view robot update',
        className: styles.view_update_button,
        onClick: viewReleaseNotes,
      },
    ]
  }

  return (
    <ScrollableAlertModal heading={HEADING} buttons={buttons} alertOverlay>
      {showReleaseNotes ? (
        <ReleaseNotes source={BUILDROOT_RELEASE_NOTES} />
      ) : (
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
            discoverable via USB or Wifi throughout the entire migration
            process.
          </p>
        </div>
      )}
    </ScrollableAlertModal>
  )
}
