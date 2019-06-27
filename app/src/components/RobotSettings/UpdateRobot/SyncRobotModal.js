// @flow
import * as React from 'react'
import { Link } from 'react-router-dom'

import SyncRobotMessage from './SyncRobotMessage'
import VersionList from './VersionList'
import UpdateBuildroot from '../UpdateBuildroot'
import { ScrollableAlertModal } from '../../modals'
import ReleaseNotes from '../../ReleaseNotes'

import { API_RELEASE_NOTES } from '../../../shell'

import type { RobotUpdateInfo } from '../../../http-api-client'
import type { VersionProps } from './types'
import type { ButtonProps } from '@opentrons/components'

type Props = {
  updateInfo: RobotUpdateInfo,
  parentUrl: string,
  versionProps: VersionProps,
  ignoreUpdate: () => mixed,
  update: () => mixed,
  showReleaseNotes: boolean,
  __buildrootEnabled: boolean,
  buildrootUpdateAvailable: boolean,
  buildrootUpdateSeen: boolean,
}

type SyncRobotState = {
  showReleaseNotes: boolean,
}

export default class SyncRobotModal extends React.Component<
  Props,
  SyncRobotState
> {
  constructor(props: Props) {
    super(props)
    this.state = { showReleaseNotes: this.props.showReleaseNotes }
  }

  setShowReleaseNotes = () => {
    this.setState({ showReleaseNotes: true })
  }

  render() {
    const {
      updateInfo,
      versionProps,
      update,
      ignoreUpdate,
      parentUrl,
      buildrootUpdateSeen,
      __buildrootEnabled,
      buildrootUpdateAvailable,
    } = this.props

    const { version } = updateInfo
    const { showReleaseNotes } = this.state

    const heading = `Robot Server Version ${version} Available`
    let buttons: Array<?ButtonProps>

    if (showReleaseNotes) {
      buttons = [
        { onClick: ignoreUpdate, children: 'not now' },
        {
          children: 'Update Robot Server',
          onClick: update,
        },
      ]
    } else if (updateInfo.type === 'upgrade') {
      buttons = [
        { onClick: ignoreUpdate, children: 'not now' },
        {
          children: 'View Robot Server Update',
          onClick: this.setShowReleaseNotes,
        },
      ]
    } else if (updateInfo.type === 'downgrade') {
      buttons = [
        { Component: Link, to: parentUrl, children: 'not now' },
        {
          children: 'Downgrade Robot',
          onClick: update,
        },
      ]
    }

    const showMigrationModal =
      buildrootUpdateAvailable &&
      showReleaseNotes &&
      __buildrootEnabled &&
      !buildrootUpdateSeen

    if (showMigrationModal) {
      return <UpdateBuildroot ignoreUpdate={ignoreUpdate} />
    }

    return (
      <ScrollableAlertModal
        heading={heading}
        buttons={buttons}
        alertOverlay
        key={String(showReleaseNotes)}
      >
        {showReleaseNotes ? (
          <ReleaseNotes source={API_RELEASE_NOTES} />
        ) : (
          <React.Fragment>
            <SyncRobotMessage updateInfo={updateInfo} />
            <VersionList {...versionProps} ignoreAppUpdate />
          </React.Fragment>
        )}
      </ScrollableAlertModal>
    )
  }
}
