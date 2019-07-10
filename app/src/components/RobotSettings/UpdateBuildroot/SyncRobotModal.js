// @flow
import * as React from 'react'
import SyncRobotMessage from './SyncRobotMessage'
import VersionList from './VersionList'
import { ScrollableAlertModal } from '../../modals'

import type { RobotUpdateInfo } from '../../../http-api-client'
import type { VersionProps } from './types'
import type { ButtonProps } from '@opentrons/components'

type Props = {
  updateInfo: RobotUpdateInfo,
  parentUrl: string,
  versionProps: VersionProps,
  ignoreUpdate: () => mixed,
  proceed: () => mixed,
}

export default function SyncRobotModal(props: Props) {
  const { updateInfo, versionProps, ignoreUpdate, proceed } = props

  let heading = 'Robot Update Available'
  let buttons: Array<?ButtonProps>

  const notNowButton = {
    onClick: ignoreUpdate,
    children: 'not now',
  }

  if (updateInfo.type === 'upgrade') {
    buttons = [
      notNowButton,
      {
        children: 'View Robot Update',
        onClick: proceed,
      },
    ]
  } else if (updateInfo.type === 'downgrade') {
    buttons = [
      notNowButton,
      {
        children: 'Downgrade Robot',
        onClick: proceed,
        disabled: true,
      },
    ]
  }

  return (
    <ScrollableAlertModal heading={heading} buttons={buttons} alertOverlay>
      <React.Fragment>
        <SyncRobotMessage updateInfo={updateInfo} />
        <VersionList {...versionProps} ignoreAppUpdate />
      </React.Fragment>
    </ScrollableAlertModal>
  )
}
