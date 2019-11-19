// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import type { State, Dispatch } from '../../types'
import type { RobotService } from '../../robot'
import type { ResetOption, ResetRobotRequest } from '../../http-api-client'

import {
  fetchResetOptions,
  makeGetRobotResetOptions,
  resetRobotData,
  makeGetRobotResetRequest,
  clearResetResponse,
} from '../../http-api-client'
import { restartRobot } from '../../robot-admin'

import { AlertModal, LabeledCheckbox } from '@opentrons/components'
import { Portal } from '../portal'

type OP = {|
  robot: RobotService,
  closeModal: () => mixed,
|}

type SP = {|
  options: ?Array<ResetOption>,
  resetRequest: ResetRobotRequest,
|}

type DP = {|
  fetchOptions: () => mixed,
  reset: (options: ResetRobotRequest) => mixed,
  restart: () => mixed,
|}

type Props = {| ...OP, ...SP, ...DP |}

const TITLE = 'Robot Factory Reset'

class ResetRobotModal extends React.Component<Props, ResetRobotRequest> {
  constructor(props: Props) {
    super(props)

    this.state = {}
  }

  toggle = (name: string) => {
    return () => this.setState({ [name]: !this.state[name] })
  }

  handleReset = () => {
    const options = this.state
    return this.props.reset(options)
  }

  componentDidMount() {
    this.props.fetchOptions()
  }

  render() {
    const { resetRequest } = this.props
    let message
    let buttons

    if (resetRequest.response) {
      message =
        'Restart your robot to finish the reset. It may take several minutes for your robot to restart'
      buttons = [{ onClick: this.props.restart, children: 'restart' }]
    } else {
      message = (
        <>
          <p>
            Warning! Clicking <strong>reset</strong> will erase your selected
            configurations and restore your robot to factory settings. This
            cannot be undone
          </p>
          {this.props.options &&
            this.props.options.map(o => (
              <LabeledCheckbox
                label={o.name}
                onChange={this.toggle(o.id)}
                name={o.id}
                value={this.state[o.id]}
                key={o.id}
              >
                <p>{o.description}</p>
              </LabeledCheckbox>
            ))}
        </>
      )
      buttons = [
        { onClick: this.props.closeModal, children: 'close' },
        { onClick: this.handleReset, children: 'reset' },
      ]
    }

    return (
      <Portal>
        <AlertModal heading={TITLE} buttons={buttons} alertOverlay>
          {message}
        </AlertModal>
      </Portal>
    )
  }
}

export default connect<Props, OP, SP, DP, State, Dispatch>(
  makeMapStateToProps,
  mapDispatchToProps
)(ResetRobotModal)

function makeMapStateToProps(): (state: State, ownProps: OP) => SP {
  const getResetOptions = makeGetRobotResetOptions()
  const getResetRequest = makeGetRobotResetRequest()

  return (state, ownProps) => {
    const { robot } = ownProps
    const optionsRequest = getResetOptions(state, robot)
    const optionsResponse = optionsRequest.response

    return {
      options: optionsResponse && optionsResponse.options,
      resetRequest: getResetRequest(state, robot),
    }
  }
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: OP): DP {
  const { robot, closeModal } = ownProps
  const fetchOptions = () => dispatch(fetchResetOptions(robot))

  return {
    fetchOptions,
    reset: options => dispatch(resetRobotData(robot, options)),
    restart: () => {
      closeModal()
      dispatch(restartRobot(robot))
      dispatch(clearResetResponse(robot))
    },
  }
}
