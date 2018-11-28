// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {Link} from 'react-router-dom'
import {push} from 'react-router-redux'
import semver from 'semver'

import {
  updateRobotServer,
  makeGetRobotUpdateInfo,
  setIgnoredUpdate,
} from '../../../http-api-client'

import {getRobotApiVersion} from '../../../discovery'

import {
  CURRENT_VERSION,
  API_RELEASE_NOTES,
  getShellUpdateState,
} from '../../../shell'

import {ScrollableAlertModal} from '../../modals'
import VersionList from './VersionList'
import UpdateAppMessage from './UpdateAppMessage'
import SkipAppUpdateMessage from './SkipAppUpdateMessage'
import SyncRobotMessage, {ReinstallMessage} from './SyncRobotMessage'
import ReleaseNotes from '../../ReleaseNotes'

import type {State, Dispatch} from '../../../types'
import type {ShellUpdateState} from '../../../shell'
import type {ViewableRobot} from '../../../discovery'
import type {RobotUpdateInfo} from '../../../http-api-client'
import type {ButtonProps} from '@opentrons/components'

export type VersionProps = {
  appVersion: string,
  robotVersion: string,
  availableUpdate: string,
}

type OP = {robot: ViewableRobot}

type SP = {|
  appVersion: string,
  robotVersion: string,
  appUpdate: ShellUpdateState,
  robotUpdateInfo: RobotUpdateInfo,
|}

type DP = {dispatch: Dispatch}

type Props = {
  ...$Exact<OP>,
  ...SP,
  ignoreUpdate: () => mixed,
  update: () => mixed,
}

type UpdateRobotState = {
  showReleaseNotes: boolean,
}

class UpdateRobotModal extends React.Component<Props, UpdateRobotState> {
  constructor (props) {
    super(props)
    this.state = {showReleaseNotes: false}
  }

  setShowReleaseNotes = () => {
    this.setState({showReleaseNotes: true})
  }

  render () {
    const {
      update,
      ignoreUpdate,
      appVersion,
      robotVersion,
      robotUpdateInfo,
      appUpdate: {available: appUpdateAvailable, info: appUpdateInfo},
    } = this.props
    const {showReleaseNotes} = this.state
    const appUpdateVersion = appUpdateInfo && appUpdateInfo.version
    const robotUpdateVersion = robotUpdateInfo.version
    const availableUpdate = appUpdateVersion || robotUpdateVersion
    const versionProps = {appVersion, robotVersion, availableUpdate}

    const heading = !semver.eq(robotVersion, availableUpdate)
      ? `Version ${availableUpdate} available`
      : 'Robot is up to date'

    let message: ?React.Node
    let skipMessage: ?React.Node
    let button: ?ButtonProps

    if (showReleaseNotes) {
      button = {
        children: 'Upgrade Robot',
        onClick: update,
      }
    } else if (appUpdateAvailable) {
      message = <UpdateAppMessage {...versionProps} />
      skipMessage = (
        <SkipAppUpdateMessage
          onClick={() => console.log('skip and sync')}
          {...versionProps}
        />
      )
      button = {
        Component: Link,
        to: '/menu/app/update',
        children: 'View App Update',
      }
    } else if (robotUpdateInfo.type) {
      message = (
        <SyncRobotMessage updateInfo={robotUpdateInfo} {...versionProps} />
      )
      if (robotUpdateInfo.type === 'upgrade') {
        button = {
          children: 'View Robot Server Update',
          onClick: this.setShowReleaseNotes,
        }
      } else if (robotUpdateInfo.type === 'downgrade') {
        button = {
          children: 'Downgrade Robot',
          onClick: update,
        }
      }
    } else {
      message = <ReinstallMessage />
      button = {
        children: 'Reinstall',
        onClick: update,
      }
    }

    return (
      <ScrollableAlertModal
        heading={heading}
        alertOverlay
        buttons={[{onClick: ignoreUpdate, children: 'not now'}, button]}
        key={String(showReleaseNotes)}
      >
        {showReleaseNotes ? (
          <ReleaseNotes source={API_RELEASE_NOTES} />
        ) : (
          <React.Fragment>
            {message}
            <VersionList {...versionProps} />
            {skipMessage}
          </React.Fragment>
        )}
      </ScrollableAlertModal>
    )
  }
}

function makeMapStateToProps (): (State, OP) => SP {
  const getRobotUpdateInfo = makeGetRobotUpdateInfo()

  return (state, ownProps) => ({
    appVersion: CURRENT_VERSION,
    robotVersion: getRobotApiVersion(ownProps.robot) || 'Unknown',
    appUpdate: getShellUpdateState(state),
    robotUpdateInfo: getRobotUpdateInfo(state, ownProps.robot),
  })
}

function mergeProps (stateProps: SP, dispatchProps: DP, ownProps: OP): Props {
  const {robot} = ownProps
  const {robotUpdateInfo} = stateProps
  const {dispatch} = dispatchProps

  const close = () => dispatch(push(`/robots/${robot.name}`))
  let ignoreUpdate = robotUpdateInfo.type
    ? () =>
      dispatch(setIgnoredUpdate(robot, robotUpdateInfo.version)).then(close)
    : close

  return {
    ...stateProps,
    ...ownProps,
    ignoreUpdate,
    update: () => dispatch(updateRobotServer(robot)),
  }
}

export default connect(
  makeMapStateToProps,
  null,
  mergeProps
)(UpdateRobotModal)
