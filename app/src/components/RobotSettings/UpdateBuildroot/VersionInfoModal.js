// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { getRobotApiVersion } from '../../../discovery'
import { CURRENT_VERSION, getShellUpdateState } from '../../../shell'

import { AlertModal } from '@opentrons/components'
import UpdateAppMessage from './UpdateAppMessage'
import VersionList from './VersionList'
import SkipAppUpdateMessage from './SkipAppUpdateMessage'
import SyncRobotMessage from './SyncRobotMessage'
import styles from './styles.css'

import type { BuildrootUpdateType } from '../../../shell'
import type { ViewableRobot } from '../../../discovery'

type Props = {|
  robot: ViewableRobot,
  robotUpdateType: BuildrootUpdateType,
  close: () => mixed,
  proceed: () => mixed,
|}

const REINSTALL_HEADING = 'Robot is up to date'
const REINSTALL_MESSAGE =
  "It looks like your robot is already up to date, but if you're experiencing issues you can re-apply the latest update."

export default function VersionInfoModal(props: Props) {
  const { robot, robotUpdateType, close, proceed } = props
  const appUpdate = useSelector(getShellUpdateState)
  const robotVersion = getRobotApiVersion(robot)
  const appUpdateVersion = appUpdate.info?.version

  const versionProps = {
    robotVersion: robotVersion != null ? robotVersion : null,
    appVersion: CURRENT_VERSION,
    availableUpdate:
      appUpdateVersion != null ? appUpdateVersion : CURRENT_VERSION,
  }

  let heading = ''
  let primaryButton = null
  let message = null
  let secondaryMessage = null

  if (appUpdate.available) {
    heading = `Robot Version ${versionProps.availableUpdate} Available`
    message = <UpdateAppMessage {...versionProps} />
    secondaryMessage = <SkipAppUpdateMessage onClick={proceed} />
    primaryButton = {
      Component: Link,
      to: '/menu/app/update',
      children: 'View App Update',
    }
  } else if (robotUpdateType === 'upgrade' || robotUpdateType === 'downgrade') {
    heading = 'Robot Update Available'
    message = (
      <SyncRobotMessage
        updateType={robotUpdateType}
        version={versionProps.availableUpdate}
      />
    )
  } else {
    heading = REINSTALL_HEADING
    message = <p className={styles.reinstall_message}>{REINSTALL_MESSAGE}</p>
    primaryButton = { onClick: proceed, children: 'Reinstall' }
  }

  return (
    <AlertModal
      heading={heading}
      buttons={[{ children: 'not now', onClick: close }, primaryButton]}
      restrictOuterScroll={false}
      alertOverlay
    >
      {message}
      <VersionList {...versionProps} />
      {secondaryMessage}
    </AlertModal>
  )
}
