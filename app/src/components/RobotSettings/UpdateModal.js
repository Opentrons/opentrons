// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'

import type {State, Dispatch} from '../../types'
import type {Robot} from '../../robot'
import type {RobotServerUpdate, RobotServerRestart} from '../../http-api-client'
import {
  updateRobotServer,
  restartRobotServer,
  makeGetAvailableRobotUpdate,
  makeGetRobotUpdateRequest,
  makeGetRobotRestartRequest,
  setIgnoredUpdate,
} from '../../http-api-client'

import {AlertModal, Icon} from '@opentrons/components'

type OP = Robot

type SP = {
  availableUpdate: ?string,
  updateRequest: RobotServerUpdate,
  restartRequest: RobotServerRestart,
}

type DP = {dispatch: Dispatch}

type Props = OP & SP & {
  update: () => mixed,
  restart: () => mixed,
  ignoreUpdate: () => mixed,
}

const UPDATE_MSG = "We recommend updating your robot's software to the latest version"
const ALREADY_UPDATED_MSG = "It looks like your robot is already up to date, but if you're experiencing issues you can re-apply the latest update."
const RESTART_MSG = 'Restart your robot to finish the update. It may take several minutes for your robot to restart.'
const DONE_MSG = 'Your robot has been updated. Please wait for your robot to fully restart, which may take several minutes.'

// TODO(mc, 2018-03-19): prop or component for text-height icons
const Spinner = () => (<Icon name='ot-spinner' height='1em' spin />)

export default connect(makeMapStateToProps, null, mergeProps)(UpdateModal)

function UpdateModal (props: Props) {
  const {ignoreUpdate, update, restart, updateRequest, restartRequest} = props
  const availableUpdate = props.availableUpdate || ''
  const inProgress = updateRequest.inProgress || restartRequest.inProgress
  let closeButtonText = 'not now'
  let message
  let button

  const heading = availableUpdate
    ? `Version ${availableUpdate || ''} available`
    : 'Robot is up to date'

  if (!updateRequest.response) {
    message = availableUpdate
      ? UPDATE_MSG
      : ALREADY_UPDATED_MSG
    button = inProgress
      ? {disabled: true, children: (<Spinner />)}
      : {onClick: update, children: 'update'}
  } else if (!restartRequest.response) {
    message = RESTART_MSG
    button = inProgress
      ? {disabled: true, children: (<Spinner />)}
      : {onClick: restart, children: 'restart'}
  } else {
    message = DONE_MSG
    button = null
    closeButtonText = 'close'
  }

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
  const getAvailableRobotUpdate = makeGetAvailableRobotUpdate()
  const getRobotUpdateRequest = makeGetRobotUpdateRequest()
  const getRobotRestartRequest = makeGetRobotRestartRequest()

  return (state, ownProps) => ({
    availableUpdate: getAvailableRobotUpdate(state, ownProps),
    updateRequest: getRobotUpdateRequest(state, ownProps),
    restartRequest: getRobotRestartRequest(state, ownProps),
  })
}

function mergeProps (stateProps: SP, dispatchProps: DP, ownProps: OP): Props {
  const {availableUpdate} = stateProps
  const {dispatch} = dispatchProps

  const close = () => dispatch(push(`/robots/${ownProps.name}`))
  let ignoreUpdate = availableUpdate
    ? () => dispatch(setIgnoredUpdate(ownProps, availableUpdate)).then(close)
    : close

  return {
    ...stateProps,
    ...ownProps,
    ignoreUpdate,
    update: () => dispatch(updateRobotServer(ownProps)),
    restart: () => dispatch(restartRobotServer(ownProps)).then(close),
  }
}
