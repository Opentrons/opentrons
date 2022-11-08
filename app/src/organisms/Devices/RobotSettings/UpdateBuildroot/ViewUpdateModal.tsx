import * as React from 'react'
import { useSelector } from 'react-redux'

import {
  BALENA,
  UPGRADE,
  getBuildrootUpdateInfo,
  getBuildrootDownloadProgress,
  getBuildrootDownloadError,
} from '../../../../redux/buildroot'

import { MigrationWarningModal } from './MigrationWarningModal'
import { DownloadUpdateModal } from './DownloadUpdateModal'
import { ReleaseNotesModal } from './ReleaseNotesModal'

import type {
  SystemUpdateType,
  RobotSystemType,
} from '../../../../redux/buildroot/types'

export interface ViewUpdateModalProps {
  robotName: string
  robotUpdateType: SystemUpdateType | null
  robotSystemType: RobotSystemType | null
  close: () => unknown
  proceed: () => unknown
}

export function ViewUpdateModal(
  props: ViewUpdateModalProps
): JSX.Element | null {
  const { robotName, robotUpdateType, robotSystemType, close, proceed } = props
  const updateInfo = useSelector(getBuildrootUpdateInfo)
  const downloadProgress = useSelector(getBuildrootDownloadProgress)
  const downloadError = useSelector(getBuildrootDownloadError)

  const [
    showMigrationWarning,
    setShowMigrationWarning,
  ] = React.useState<boolean>(robotSystemType === BALENA)

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
        releaseNotes={updateInfo.releaseNotes}
        systemType={robotSystemType}
        proceed={proceed}
      />
    )
  }

  return null
}
