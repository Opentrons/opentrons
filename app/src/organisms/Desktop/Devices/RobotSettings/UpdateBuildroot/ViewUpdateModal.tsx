import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useSelector } from 'react-redux'

import { getTopPortalEl } from '/app/App/portal'
import { UpdateAppModal } from '/app/organisms/Desktop/UpdateAppModal'
import {
  getRobotSystemType,
  getRobotUpdateAvailable,
  getRobotUpdateDownloadError,
  getRobotUpdateInfo,
  OT2_BALENA,
} from '/app/redux/robot-update'
import { getAvailableShellUpdate } from '/app/redux/shell'

import { MigrationWarningModal } from './MigrationWarningModal'
import { UpdateRobotModal } from './UpdateRobotModal'

import type { ReachableRobot, Robot } from '/app/redux/discovery/types'
import type { State } from '/app/redux/types'

export interface ViewUpdateModalProps {
  robotName: string
  robot: Robot | ReachableRobot
  closeModal: () => void
}

export function ViewUpdateModal(
  props: ViewUpdateModalProps
): JSX.Element | null {
  const { robotName, robot, closeModal } = props
  const [showAppUpdateModal, setShowAppUpdateModal] = useState(true)

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

  const [showMigrationWarning, setShowMigrationWarning] = useState<boolean>(
    robotSystemType === OT2_BALENA
  )

  const notNowButton = {
    onClick: closeModal,
    children: downloadError !== null ? 'close' : 'not now',
  }

  let releaseNotes = ''
  if (updateInfo?.releaseNotes != null) releaseNotes = updateInfo.releaseNotes

  if (availableAppUpdateVersion && showAppUpdateModal) {
    return createPortal(
      <UpdateAppModal
        closeModal={() => {
          setShowAppUpdateModal(false)
        }}
      />,
      getTopPortalEl()
    )
  }

  if (showMigrationWarning) {
    return (
      <MigrationWarningModal
        notNowButton={notNowButton}
        updateType={robotUpdateType}
        proceed={() => {
          setShowMigrationWarning(false)
        }}
      />
    )
  }

  if (robotSystemType != null) {
    return (
      <UpdateRobotModal
        robotName={robotName}
        releaseNotes={releaseNotes}
        systemType={robotSystemType}
        updateType={robotUpdateType}
        closeModal={closeModal}
      />
    )
  }

  return null
}
