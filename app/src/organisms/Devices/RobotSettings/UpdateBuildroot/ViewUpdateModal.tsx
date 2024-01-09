import * as React from 'react'
import { useSelector } from 'react-redux'

import {
  OT2_BALENA,
  getRobotUpdateInfo,
  getRobotUpdateDownloadError,
  getRobotSystemType,
  getRobotUpdateAvailable,
} from '../../../../redux/robot-update'
import { getAvailableShellUpdate } from '../../../../redux/shell'
import { Portal } from '../../../../App/portal'
import { UpdateAppModal } from '../../../../organisms/UpdateAppModal'
import { MigrationWarningModal } from './MigrationWarningModal'
import { UpdateRobotModal } from './UpdateRobotModal'

import type { State } from '../../../../redux/types'
import { ReachableRobot, Robot } from '../../../../redux/discovery/types'

export interface ViewUpdateModalProps {
  robotName: string
  robot: Robot | ReachableRobot
  closeModal: () => void
}

export function ViewUpdateModal(
  props: ViewUpdateModalProps
): JSX.Element | null {
  const { robotName, robot, closeModal } = props
  const [showAppUpdateModal, setShowAppUpdateModal] = React.useState(true)

  const updateInfo = useSelector((state: State) =>
    getRobotUpdateInfo(state, robotName)
  )
  const downloadError = useSelector((state: State) =>
    getRobotUpdateDownloadError(state, robotName)
  )
  const robotUpdateType = useSelector((state: State) =>
    getRobotUpdateAvailable(state, robot)
  )
  const robotSystemType = getRobotSystemType(robot)
  const availableAppUpdateVersion = Boolean(
    useSelector(getAvailableShellUpdate)
  )

  const [
    showMigrationWarning,
    setShowMigrationWarning,
  ] = React.useState<boolean>(robotSystemType === OT2_BALENA)

  const notNowButton = {
    onClick: closeModal,
    children: downloadError !== null ? 'close' : 'not now',
  }

  let releaseNotes = ''
  if (updateInfo?.releaseNotes != null) releaseNotes = updateInfo.releaseNotes

  if (availableAppUpdateVersion && showAppUpdateModal)
    return (
      <Portal>
        <UpdateAppModal closeModal={() => setShowAppUpdateModal(false)} />
      </Portal>
    )

  if (showMigrationWarning) {
    return (
      <MigrationWarningModal
        notNowButton={notNowButton}
        updateType={robotUpdateType}
        proceed={() => setShowMigrationWarning(false)}
      />
    )
  }

  if (robotSystemType != null)
    return (
      <UpdateRobotModal
        robotName={robotName}
        releaseNotes={releaseNotes}
        systemType={robotSystemType}
        updateType={robotUpdateType}
        closeModal={closeModal}
      />
    )

  return null
}
