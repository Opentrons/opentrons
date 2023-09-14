import * as React from 'react'
import { useSelector } from 'react-redux'

import {
  OT2_BALENA,
  UPGRADE,
  getRobotUpdateInfo,
  getRobotUpdateDownloadProgress,
  getRobotUpdateDownloadError,
} from '../../../../redux/robot-update'
import { getAvailableShellUpdate } from '../../../../redux/shell'
import { Portal } from '../../../../App/portal'
import { UpdateAppModal } from '../../../../organisms/UpdateAppModal'
import { MigrationWarningModal } from './MigrationWarningModal'
import { RobotUpdateProgressModal } from './RobotUpdateProgressModal'
import { UpdateRobotModal } from './UpdateRobotModal'

import type {
  RobotUpdateType,
  RobotSystemType,
} from '../../../../redux/robot-update/types'
import type { State } from '../../../../redux/types'

export interface ViewUpdateModalProps {
  robotName: string
  robotUpdateType: RobotUpdateType | null
  robotSystemType: RobotSystemType | null
  closeModal: () => void
}

export function ViewUpdateModal(
  props: ViewUpdateModalProps
): JSX.Element | null {
  const { robotName, robotUpdateType, robotSystemType, closeModal } = props

  const updateInfo = useSelector((state: State) =>
    getRobotUpdateInfo(state, robotName)
  )
  const downloadProgress = useSelector((state: State) =>
    getRobotUpdateDownloadProgress(state, robotName)
  )
  const downloadError = useSelector((state: State) =>
    getRobotUpdateDownloadError(state, robotName)
  )
  const availableAppUpdateVersion = useSelector(getAvailableShellUpdate)

  const [
    showMigrationWarning,
    setShowMigrationWarning,
  ] = React.useState<boolean>(robotSystemType === OT2_BALENA)

  const notNowButton = {
    onClick: closeModal,
    children: downloadError !== null ? 'close' : 'not now',
  }

  const showReleaseNotes = robotUpdateType === UPGRADE
  let releaseNotes = ''
  if (updateInfo?.releaseNotes) releaseNotes = updateInfo.releaseNotes

  if (availableAppUpdateVersion)
    return (
      <Portal>
        <UpdateAppModal closeModal={close} />
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

  if (updateInfo === null)
    return (
      <RobotUpdateProgressModal
        robotName={robotName}
        updateStep="download"
        stepProgress={downloadProgress}
        error={downloadError}
      />
    )

  if (showReleaseNotes)
    return (
      <UpdateRobotModal
        robotName={robotName}
        releaseNotes={releaseNotes}
        systemType={robotSystemType}
        closeModal={closeModal}
      />
    )

  return null
}
