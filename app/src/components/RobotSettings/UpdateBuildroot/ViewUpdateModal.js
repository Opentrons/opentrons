// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'

import {
  getBuildrootUpdateInfo,
  getBuildrootDownloadProgress,
  getBuildrootDownloadError,
} from '../../../buildroot'

import type {
  BuildrootUpdateType,
  RobotSystemType,
} from '../../../buildroot/types'
import { MigrationWarningModal } from './MigrationWarningModal'
import { DownloadUpdateModal } from './DownloadUpdateModal'
import { ReleaseNotesModal } from './ReleaseNotesModal'

export type ViewUpdateModalProps = {|
  robotName: string,
  robotUpdateType: BuildrootUpdateType | null,
  robotSystemType: RobotSystemType | null,
  close: () => mixed,
  proceed: () => mixed,
|}

export function ViewUpdateModal(props: ViewUpdateModalProps): React.Node {
  const { robotName, robotUpdateType, robotSystemType, close, proceed } = props
  const updateInfo = useSelector(getBuildrootUpdateInfo)
  const downloadProgress = useSelector(getBuildrootDownloadProgress)
  const downloadError = useSelector(getBuildrootDownloadError)

  const [
    showMigrationWarning,
    setShowMigrationWarning,
  ] = React.useState<boolean>(robotSystemType === 'balena')

  const notNowButton = {
    onClick: close,
    children: downloadError !== null ? 'close' : 'not now',
  }
  const showReleaseNotes = robotUpdateType === 'upgrade'

  React.useLayoutEffect(() => {
    if (updateInfo && !showReleaseNotes && !showMigrationWarning) {
      proceed()
    }
  }, [updateInfo, showReleaseNotes, showMigrationWarning, proceed])

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
