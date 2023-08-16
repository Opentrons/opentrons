import * as React from 'react'
import { useSelector } from 'react-redux'

import {
  OT2_BALENA,
  UPGRADE,
  getRobotUpdateInfo,
  getRobotUpdateDownloadProgress,
  getRobotUpdateDownloadError,
} from '../../../../redux/robot-update'

import { MigrationWarningModal } from './MigrationWarningModal'
import { DownloadUpdateModal } from './DownloadUpdateModal'
import { ReleaseNotesModal } from './ReleaseNotesModal'

import type {
  RobotUpdateType,
  RobotSystemType,
} from '../../../../redux/robot-update/types'

import type { State } from '../../../../redux/types'

export interface ViewUpdateModalProps {
  robotName: string
  robotUpdateType: RobotUpdateType | null
  robotSystemType: RobotSystemType | null
  close: () => unknown
  proceed: () => unknown
}

export function ViewUpdateModal(
  props: ViewUpdateModalProps
): JSX.Element | null {
  const { robotName, robotUpdateType, robotSystemType, close, proceed } = props
  const updateInfo = useSelector((state: State) =>
    getRobotUpdateInfo(state, robotName)
  )
  const downloadProgress = useSelector((state: State) =>
    getRobotUpdateDownloadProgress(state, robotName)
  )
  const downloadError = useSelector((state: State) =>
    getRobotUpdateDownloadError(state, robotName)
  )

  const [
    showMigrationWarning,
    setShowMigrationWarning,
  ] = React.useState<boolean>(robotSystemType === OT2_BALENA)

  const notNowButton = {
    onClick: close,
    children: downloadError !== null ? 'close' : 'not now',
  }
  const showReleaseNotes = robotUpdateType === UPGRADE

  if (showMigrationWarning) {
    return (
      <MigrationWarningModal
        notNowButton={notNowButton}
        updateType={robotUpdateType}
        proceed={() => setShowMigrationWarning(false)}
      />
    )
  }

  if (updateInfo === null) {
    return (
      <DownloadUpdateModal
        notNowButton={notNowButton}
        error={downloadError}
        progress={downloadProgress}
      />
    )
  }

  if (showReleaseNotes) {
    return (
      <ReleaseNotesModal
        robotName={robotName}
        notNowButton={notNowButton}
        releaseNotes={updateInfo.releaseNotes ?? ''}
        systemType={robotSystemType}
        proceed={proceed}
      />
    )
  }

  return null
}
