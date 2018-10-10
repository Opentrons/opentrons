// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'

import {
  updateRobotServer,
  restartRobotServer,
  clearUpdateResponse,
  makeGetRobotUpdateInfo,
  makeGetRobotUpdateRequest,
  makeGetRobotRestartRequest,
  setIgnoredUpdate,
} from '../../http-api-client'

import {getShellUpdateState} from '../../shell'

import type {ShellUpdateState} from '../../shell'

import {Icon} from '@opentrons/components'
import {ScrollableAlertModal} from '../modals'
import UpdateAppMessage from './UpdateAppMessage'
import UpdateRobotMessage from './UpdateRobotMessage'
import ReleaseNotes from '../ReleaseNotes'

import type {State, Dispatch} from '../../types'
import type {ViewableRobot} from '../../discovery'
import type {
  RobotServerUpdate,
  RobotServerRestart,
  RobotUpdateInfo,
} from '../../http-api-client'

type OP = {robot: ViewableRobot}

type SP = {|
  appUpdate: ShellUpdateState,
  updateInfo: RobotUpdateInfo,
  updateRequest: RobotServerUpdate,
  restartRequest: RobotServerRestart,
|}

type DP = {dispatch: Dispatch}

type Props = {
  ...$Exact<OP>,
  ...SP,
  update: () => mixed,
  restart: () => mixed,
  ignoreUpdate: () => mixed,
}

const DOWNGRADE_MSG =
  'Your app is at an older version than your robot. You may want to downgrade your robot to ensure compatability.'
const UPGRADE_MSG =
  'Your robot is at an older version than your app. We recommend you upgrade your robot to ensure compatability.'
const ALREADY_UPDATED_MSG =
  "It looks like your robot is already up to date, but if you're experiencing issues you can re-apply the latest update."
const RESTART_MSG =
  'Restart your robot to finish the update. It may take several minutes for your robot to restart.'

// TODO(mc, 2018-03-19): prop or component for text-height icons
const Spinner = () => <Icon name="ot-spinner" height="1em" spin />

export default connect(
  makeMapStateToProps,
  null,
  mergeProps
)(RobotUpdateModal)

function RobotUpdateModal (props: Props) {
  const {
    updateInfo,
    ignoreUpdate,
    update,
    restart,
    updateRequest,
    restartRequest,
    appUpdate: {available, info},
  } = props
  const inProgress = updateRequest.inProgress || restartRequest.inProgress
  let closeButtonText = 'not now'
  let message
  let button

  const heading = updateInfo.type
    ? `Version ${updateInfo.version} available`
    : 'Robot is up to date'

  let buttonAction
  let buttonText
  if (!updateRequest.response) {
    buttonAction = update
    if (updateInfo.type) {
      message = updateInfo.type === 'upgrade' ? UPGRADE_MSG : DOWNGRADE_MSG
      buttonText = updateInfo.type
    } else {
      message = ALREADY_UPDATED_MSG
      buttonText = 'reinstall'
    }
  } else {
    message = RESTART_MSG
    buttonText = 'restart'
    buttonAction = restart
  }

  button = inProgress
    ? {disabled: true, children: <Spinner />}
    : {onClick: buttonAction, children: buttonText}

  let source =
    info && info.releaseNotes ? removeAppNotes(info.releaseNotes) : null

  return (
    <ScrollableAlertModal
      heading={heading}
      buttons={[{onClick: ignoreUpdate, children: closeButtonText}, button]}
      alertOverlay
    >
      {available && <UpdateAppMessage />}
      <UpdateRobotMessage message={message} />
      <ReleaseNotes source={source} />
    </ScrollableAlertModal>
  )
}

function makeMapStateToProps (): (State, OP) => SP {
  const getRobotUpdateInfo = makeGetRobotUpdateInfo()
  const getRobotUpdateRequest = makeGetRobotUpdateRequest()
  const getRobotRestartRequest = makeGetRobotRestartRequest()

  return (state, ownProps) => ({
    appUpdate: getShellUpdateState(state),
    updateInfo: getRobotUpdateInfo(state, ownProps.robot),
    updateRequest: getRobotUpdateRequest(state, ownProps.robot),
    restartRequest: getRobotRestartRequest(state, ownProps.robot),
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
    restart: () => {
      dispatch(restartRobotServer(robot))
        .then(() => dispatch(clearUpdateResponse(robot)))
        .then(close)
    },
  }
}

// TODO (ka, 2018-10-1):
// Grabbing only the api notes removes changes since and technical change log

const RE_APP_NOTES = /<!-- start:@opentrons\/app -->([\S\s]*?)<!-- end:@opentrons\/app -->/

function removeAppNotes (notes: string) {
  return notes.replace(RE_APP_NOTES, '')
}
