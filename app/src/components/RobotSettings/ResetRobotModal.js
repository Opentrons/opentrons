// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'
import type {State, Dispatch} from '../../types'
import type {Robot} from '../../robot'
import type {ResetOption, ResetRobotRequest, RobotServerRestart} from '../../http-api-client'
import {
  fetchResetOptions,
  makeGetRobotResetOptions,
  resetRobotData,
  makeGetRobotResetRequest,
  makeGetRobotRestartRequest,
  restartRobotServer,
  clearResetResponse,
  clearRestartResponse
} from '../../http-api-client'
import {chainActions} from '../../util'

import {AlertModal} from '@opentrons/components'
import {Portal} from '../portal'
import {LabeledCheckbox} from '../controls'

type OP = {
  robot: Robot
}

type SP = {
  options: ?Array<ResetOption>,
  resetRequest: ResetRobotRequest,
  restartRequest: RobotServerRestart,
}

type DP = {dispatch: Dispatch}

type Props = SP & {
  fetchOptions: () => mixed,
  closeModal: () => mixed,
  reset: (options: ResetRobotRequest) => mixed,
  restart: () => mixed,
}

const TITLE = 'Robot Factory Reset'

class ResetRobotModal extends React.Component<Props, ResetRobotRequest> {
  constructor (props: Props) {
    super(props)

    this.state = {}
  }

  toggle = (name) => {
    return () => this.setState({[name]: !this.state[name]})
  }

  handleReset = () => {
    const options = this.state
    return this.props.reset(options)
  }

  componentDidMount () {
    this.props.fetchOptions()
  }

  render () {
    const {resetRequest, restartRequest} = this.props
    let message
    let buttons
    if (restartRequest.response) {
      message = 'Your robot has been updated. Please wait for your robot to fully restart, which may take several minutes.'
      buttons = [
        {onClick: this.props.closeModal, children: 'close'}
      ]
    } else if (resetRequest.response) {
      message = 'Restart your robot to finish the reset. It may take several minutes for your robot to restart'
      buttons = [
        {onClick: this.props.restart, children: 'restart'}
      ]
    } else {
      message = (
        <React.Fragment>
          <p>Warning! Clicking <strong>reset</strong> will erase your selected configurations and restore your robot to factory settings. This cannot be undone</p>
          {this.props.options && this.props.options.map(o => (
            <LabeledCheckbox
              label= {o.name}
              onChange= {this.toggle(o.id)}
              name={o.id}
              value={this.state[o.id]}
              key={o.id}>
              <p>{o.description}</p>
            </LabeledCheckbox>
          ))}
        </React.Fragment>
      )
      buttons = [
        {onClick: this.props.closeModal, children: 'close'},
        {onClick: this.handleReset, children: 'reset'}
      ]
    }

    return (
      <Portal>
        <AlertModal
          heading={TITLE}
          buttons={buttons}
          alertOverlay
        >
          {message}
        </AlertModal>
      </Portal>
    )
  }
}

export default connect(makeMapStateToProps, null, mergeProps)(ResetRobotModal)

function makeMapStateToProps (): (state: State, ownProps: OP) => SP {
  const getResetOptions = makeGetRobotResetOptions()
  const getResetRequest = makeGetRobotResetRequest()
  const getRobotRestartRequest = makeGetRobotRestartRequest()
  return (state, ownProps) => {
    const {robot} = ownProps
    const optionsRequest = getResetOptions(state, robot)
    const optionsResponse = optionsRequest.response
    return {
      options: optionsResponse && optionsResponse.options,
      resetRequest: getResetRequest(state, robot),
      restartRequest: getRobotRestartRequest(state, robot)
    }
  }
}

function mergeProps (stateProps: SP, dispatchProps: DP, ownProps: OP): Props {
  const {restartRequest} = stateProps
  const {robot} = ownProps
  const {dispatch} = dispatchProps

  const close = () => dispatch(push(`/robots/${robot.name}`))
  let closeModal = restartRequest
    ? () => dispatch(chainActions(
      clearRestartResponse(robot),
      push(`/robots/${robot.name}`)
    ))
    : close

  let fetchOptions = restartRequest
    ? () => dispatch(chainActions(
      clearRestartResponse(robot),
      fetchResetOptions(robot)
    ))
    : () => dispatch(fetchResetOptions(robot))

  return {
    ...stateProps,
    closeModal,
    fetchOptions,
    reset: (options) => dispatch(resetRobotData(robot, options)),
    restart: () => dispatch(chainActions(
      restartRobotServer(robot),
      clearResetResponse(robot)
    ))
  }
}
