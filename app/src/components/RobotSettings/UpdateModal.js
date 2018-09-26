// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'

import type {State, Dispatch} from '../../types'
import type {Robot} from '../../robot'
import type {RobotServerUpdate, RobotServerRestart, RobotUpdateInfo} from '../../http-api-client'
import {
  updateRobotServer,
  restartRobotServer,
  clearUpdateResponse,
  makeGetRobotUpdateInfo,
  makeGetRobotUpdateRequest,
  makeGetRobotRestartRequest,
  setIgnoredUpdate,
} from '../../http-api-client'

import {AlertModal, Icon} from '@opentrons/components'

type OP = Robot

type SP = {
  updateInfo: RobotUpdateInfo,
  updateRequest: RobotServerUpdate,
  restartRequest: RobotServerRestart,
}

type DP = {dispatch: Dispatch}

type Props = OP & SP & {
  update: () => mixed,
  restart: () => mixed,
  ignoreUpdate: () => mixed,
}

const DOWNGRADE_MSG = 'Your app is at an older version than your robot. You may want to downgrade your robot to ensure compatability.'
const UPGRADE_MSG = 'Your robot is at an older version than your app. We recommend you upgrade your robot to ensure compatability.'
const ALREADY_UPDATED_MSG = "It looks like your robot is already up to date, but if you're experiencing issues you can re-apply the latest update."
const RESTART_MSG = 'Restart your robot to finish the update. It may take several minutes for your robot to restart.'

// TODO(mc, 2018-03-19): prop or component for text-height icons
const Spinner = () => (<Icon name='ot-spinner' height='1em' spin />)

export default connect(makeMapStateToProps, null, mergeProps)(UpdateModal)

function UpdateModal (props: Props) {
  const {updateInfo, ignoreUpdate, update, restart, updateRequest, restartRequest} = props
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
      message = updateInfo.type === 'upgrade'
        ? UPGRADE_MSG
        : DOWNGRADE_MSG
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
    ? {disabled: true, children: (<Spinner />)}
    : {onClick: buttonAction, children: buttonText}

  return (
    <AlertModal
      heading={heading}
      buttons={[
        {onClick: ignoreUpdate, children: closeButtonText},
        button,
      ]}
      alertOverlay
    >
      {message}
    </AlertModal>
  )
}

function makeMapStateToProps (): (State, OP) => SP {
  const getRobotUpdateInfo = makeGetRobotUpdateInfo()
  const getRobotUpdateRequest = makeGetRobotUpdateRequest()
  const getRobotRestartRequest = makeGetRobotRestartRequest()

  return (state, ownProps) => ({
    updateInfo: getRobotUpdateInfo(state, ownProps),
    updateRequest: getRobotUpdateRequest(state, ownProps),
    restartRequest: getRobotRestartRequest(state, ownProps),
  })
}

function mergeProps (stateProps: SP, dispatchProps: DP, ownProps: OP): Props {
  const {updateInfo} = stateProps
  const {dispatch} = dispatchProps

  const close = () => dispatch(push(`/robots/${ownProps.name}`))
  let ignoreUpdate = updateInfo
    ? () => dispatch(setIgnoredUpdate(ownProps, updateInfo.version)).then(close)
    : close

  return {
    ...stateProps,
    ...ownProps,
    ignoreUpdate,
    update: () => dispatch(updateRobotServer(ownProps)),
    restart: () => {
      dispatch(restartRobotServer(ownProps))
        .then(() => dispatch(clearUpdateResponse(ownProps)))
        .then(close)
    },
  }
}
