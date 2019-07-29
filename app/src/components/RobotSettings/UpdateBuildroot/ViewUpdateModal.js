// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'

import {
  getBuildrootUpdateInfo,
  getBuildrootDownloadProgress,
  getBuildrootDownloadError,
} from '../../../shell'

import SystemMigrationModal from './SystemMigrationModal'
import DownloadUpdateModal from './DownloadUpdateModal'
import ReleaseNotesModal from './ReleaseNotesModal'

import type { BuildrootUpdateType, RobotSystemType } from '../../../shell'

type Props = {|
  robotUpdateType: BuildrootUpdateType,
  robotSystemType: RobotSystemType | null,
  close: () => mixed,
  proceed: () => mixed,
|}

export default function ViewUpdateModal(props: Props) {
  const { robotUpdateType, robotSystemType, close, proceed } = props
  const updateInfo = useSelector(getBuildrootUpdateInfo)
  const downloadProgress = useSelector(getBuildrootDownloadProgress)
  const downloadError = useSelector(getBuildrootDownloadError)

  const [
    showMigrationWarning,
    setShowMigrationWarning,
  ] = React.useState<boolean>(robotSystemType === 'balena')

  const notNowButton = { onClick: close, children: 'not now' }

  React.useLayoutEffect(() => {
    if (updateInfo && robotUpdateType !== 'upgrade' && !showMigrationWarning) {
      proceed()
    }
  }, [updateInfo, robotUpdateType, showMigrationWarning, proceed])

  if (showMigrationWarning) {
    return (
      <SystemMigrationModal
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

  return (
    <ReleaseNotesModal
      notNowButton={notNowButton}
      releaseNotes={updateInfo.releaseNotes}
      systemType={robotSystemType}
      proceed={proceed}
    />
  )
}
