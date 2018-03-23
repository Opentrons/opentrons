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
  makeGetRobotRestartRequest
} from '../../http-api-client'

import {AlertModal, Icon} from '@opentrons/components'

type OwnProps = Robot

type StateProps = {
  availableUpdate: ?string,
  updateRequest: RobotServerUpdate,
  restartRequest: RobotServerRestart
}

type DispatchProps = {
  close: () => *,
  update: () => *,
  restart: () => *
}

type Props = StateProps & DispatchProps

const UPDATE_MSG = "We recommend updating your robot's software to the latest version"
const RESTART_MSG = 'Restart your robot to finish the update. It may take several minutes for your robot to restart.'
const DONE_MSG = 'Your robot has been updated. Please wait for your robot to fully restart, which may take several minutes.'

// TODO(mc, 2018-03-19): prop or component for text-height icons
const Spinner = () => (<Icon name='ot-spinner' height='1em' spin />)

export default connect(makeMapStateToProps, mapDispatchToProps)(UpdateModal)

function UpdateModal (props: Props) {
  const {close, update, restart, updateRequest, restartRequest} = props
  const availableUpdate = props.availableUpdate || ''
  const inProgress = updateRequest.inProgress || restartRequest.inProgress
  let closeButtonText = 'not now'
  let message
  let button

  if (!updateRequest.response) {
    message = UPDATE_MSG
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
      onCloseClick={close}
      heading={`Version ${availableUpdate || ''} Available`}
      buttons={[
        {onClick: close, children: closeButtonText},
        button
      ]}
    >
      {message}
    </AlertModal>
  )
}

function makeMapStateToProps () {
  const getAvailableRobotUpdate = makeGetAvailableRobotUpdate()
  const getRobotUpdateRequest = makeGetRobotUpdateRequest()
  const getRobotRestartRequest = makeGetRobotRestartRequest()

  return (state: State, ownProps: OwnProps): StateProps => ({
    availableUpdate: getAvailableRobotUpdate(state, ownProps),
    updateRequest: getRobotUpdateRequest(state, ownProps),
    restartRequest: getRobotRestartRequest(state, ownProps)
  })
}

function mapDispatchToProps (
  dispatch: Dispatch,
  ownProps: OwnProps
): DispatchProps {
  const close = () => dispatch(push(`/robots/${ownProps.name}`))

  return {
    close,
    update: () => dispatch(updateRobotServer(ownProps)),
    restart: () => dispatch(restartRobotServer(ownProps)).then(close)
  }
}
