// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {Link} from 'react-router-dom'
import {push} from 'react-router-redux'

import {
  updateRobotServer,
  makeGetRobotUpdateInfo,
  setIgnoredUpdate,
} from '../../../http-api-client'

import {getRobotApiVersion} from '../../../discovery'

import {CURRENT_VERSION, getShellUpdateState} from '../../../shell'

import {ScrollableAlertModal} from '../../modals'
import VersionList from './VersionList'
import UpdateAppMessage from './UpdateAppMessage'
import SkipAppUpdateMessage from './SkipAppUpdateMessage'
import SyncRobotMessage from './SyncRobotMessage'

import type {State, Dispatch} from '../../../types'
import type {ShellUpdateState} from '../../../shell'
import type {ViewableRobot} from '../../../discovery'
import type {RobotUpdateInfo} from '../../../http-api-client'

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
  updateInfo: RobotUpdateInfo,
|}

type DP = {dispatch: Dispatch}

type Props = {
  ...$Exact<OP>,
  ...SP,
  ignoreUpdate: () => mixed,
  update: () => mixed,
}

export default connect(
  makeMapStateToProps,
  null,
  mergeProps
)(UpdateRobotModal)

function UpdateRobotModal (props: Props) {
  const {
    ignoreUpdate,
    appVersion,
    robotVersion,
    updateInfo,
    appUpdate: {available, info},
  } = props
  const appUpdateVersion = info ? info.version : appVersion
  const robotUpdateVersion = updateInfo.version
  const versionProps = {
    appVersion,
    robotVersion,
    availableUpdate: appUpdateVersion || appVersion,
  }

  let heading
  let button
  let buttonAction
  let buttonText
  let message
  let skipMessage = null

  if (available) {
    heading = `Version ${appUpdateVersion} available`
    buttonText = 'View App Update'
    message = <UpdateAppMessage {...versionProps} />
    skipMessage = (
      <SkipAppUpdateMessage
        onClick={() => console.log('update')}
        {...versionProps}
      />
    )
  } else if (updateInfo.type) {
    heading = `Version ${robotUpdateVersion} available`
    buttonText =
      updateInfo.type === 'upgrade'
        ? 'View Robot Server Update'
        : 'Downgrade Robot'
    message = <SyncRobotMessage updateInfo={updateInfo} {...versionProps} />
  } else {
    heading = 'Robot is up to date'
    message = null
    buttonText = 'Reinstall'
  }

  button = available
    ? {
      children: buttonText,
      Component: Link,
      to: '/menu/app/update',
    }
    : {onClick: buttonAction, children: buttonText}

  // TODO: (ka 2018-11-14): Change to stateful component,
  // Render release notes and hide VersionList based on showReleaseNotes boolean
  return (
    <ScrollableAlertModal
      heading={heading}
      alertOverlay
      buttons={[{onClick: ignoreUpdate, children: 'not now'}, button]}
    >
      {message}
      <VersionList {...versionProps} />
      {skipMessage}
    </ScrollableAlertModal>
  )
}

function makeMapStateToProps (): (State, OP) => SP {
  const getRobotUpdateInfo = makeGetRobotUpdateInfo()

  return (state, ownProps) => ({
    appVersion: CURRENT_VERSION,
    robotVersion: getRobotApiVersion(ownProps.robot) || 'Unknown',
    appUpdate: getShellUpdateState(state),
    updateInfo: getRobotUpdateInfo(state, ownProps.robot),
  })
}

function mergeProps (stateProps: SP, dispatchProps: DP, ownProps: OP): Props {
  const {robot} = ownProps
  const {updateInfo} = stateProps
  const {dispatch} = dispatchProps

  const close = () => dispatch(push(`/robots/${robot.name}`))
  let ignoreUpdate = updateInfo.type
    ? () => dispatch(setIgnoredUpdate(robot, updateInfo.version)).then(close)
    : close

  return {
    ...stateProps,
    ...ownProps,
    ignoreUpdate,
    update: () => dispatch(updateRobotServer(robot)),
  }
}
