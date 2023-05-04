import { Portal } from '../../../../App/portal'
import { UpdateAppModal } from '../../../../organisms/UpdateAppModal'
import type { BuildrootUpdateType } from '../../../../redux/buildroot/types'
import { getRobotApiVersion } from '../../../../redux/discovery'
import type { ViewableRobot } from '../../../../redux/discovery/types'
import {
  CURRENT_VERSION,
  getAvailableShellUpdate,
} from '../../../../redux/shell'
import { SkipAppUpdateMessage } from './SkipAppUpdateMessage'
import { SyncRobotMessage } from './SyncRobotMessage'
import { UpdateAppMessage } from './UpdateAppMessage'
import { VersionList } from './VersionList'
import styles from './styles.css'
import { AlertModal } from '@opentrons/components'
import type { ButtonProps } from '@opentrons/components'
import * as React from 'react'
import { useSelector } from 'react-redux'

export interface VersionInfoModalProps {
  robot: ViewableRobot
  robotUpdateType: BuildrootUpdateType | null
  close: () => unknown
  goToViewUpdate: () => unknown
  installUpdate: () => unknown
}

const REINSTALL_HEADING = 'Robot is up to date'
const REINSTALL_MESSAGE =
  "It looks like your robot is already up to date, but if you're experiencing issues you can re-apply the latest update."

export function VersionInfoModal(props: VersionInfoModalProps): JSX.Element {
  const { robot, robotUpdateType, close, installUpdate, goToViewUpdate } = props
  const [showUpdateAppModal, setShowUpdateAppModal] = React.useState(false)
  const availableAppUpdateVersion = useSelector(getAvailableShellUpdate)
  const robotVersion = getRobotApiVersion(robot)

  if (showUpdateAppModal)
    return (
      <Portal>
        <UpdateAppModal closeModal={close} />
      </Portal>
    )

  const versionProps = {
    robotVersion: robotVersion != null ? robotVersion : null,
    appVersion: CURRENT_VERSION,
    availableUpdate: availableAppUpdateVersion ?? CURRENT_VERSION,
  }

  let heading = ''
  let primaryButton: ButtonProps = { className: styles.view_update_button }
  let message = null
  let secondaryMessage = null

  if (availableAppUpdateVersion !== null) {
    heading = `App Version ${availableAppUpdateVersion} Available`
    message = <UpdateAppMessage {...versionProps} />
    secondaryMessage = <SkipAppUpdateMessage onClick={installUpdate} />
    primaryButton = {
      ...primaryButton,
      children: 'View App Update',
      onClick: () => setShowUpdateAppModal(true),
    }
  } else if (robotUpdateType === 'upgrade' || robotUpdateType === 'downgrade') {
    heading = 'Robot Update Available'
    message = (
      <SyncRobotMessage
        updateType={robotUpdateType}
        version={versionProps.availableUpdate}
      />
    )
    primaryButton = {
      ...primaryButton,
      onClick: robotUpdateType === 'upgrade' ? goToViewUpdate : installUpdate,
      children:
        robotUpdateType === 'upgrade' ? 'View Robot Update' : 'Downgrade Robot',
    }
  } else {
    heading = REINSTALL_HEADING
    message = <p className={styles.reinstall_message}>{REINSTALL_MESSAGE}</p>
    primaryButton = {
      ...primaryButton,
      onClick: installUpdate,
      children: 'Reinstall',
    }
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
