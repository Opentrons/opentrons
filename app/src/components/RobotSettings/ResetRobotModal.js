// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {goBack} from 'react-router-redux'
import type {State, Dispatch} from '../../types'
import type {Robot} from '../../robot'
import type {Option, ResetRobotRequest} from '../../http-api-client'
import {
  fetchResetOptions,
  makeGetRobotResetOptions,
  resetRobotData,
  makeGetRobotResetRequest,
  restartRobotServer
} from '../../http-api-client'
import {AlertModal} from '@opentrons/components'
import {Portal} from '../portal'
import {LabeledCheckbox} from '../controls'

type OP = {
  robot: Robot
}

type SP = {
  options: ?Array<Option>,
  resetRequest: ResetRobotRequest,
}

type DP = {
  fetchOptions: () => mixed,
  close: () => mixed,
  reset: (options: ResetRobotRequest) => mixed,
  restart: () => mixed,
}

type OptionsState = {
  deckCalibration: boolean,
  labwareCalibration: boolean,
  tipProbe: boolean,
  bootScripts: boolean,
}

type Props = SP & DP

const TITLE = 'Robot Factory Reset'

class ResetRobotModal extends React.Component<Props, OptionsState> {
  constructor (props: Props) {
    super(props)

    this.state = {
      deckCalibration: false,
      labwareCalibration: false,
      tipProbe: false,
      bootScripts: false
    }
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
    const {resetRequest} = this.props
    if (resetRequest && resetRequest.response) {
      return (
        <Portal>
          <AlertModal
            heading={TITLE}
            buttons={[
              {onClick: this.props.restart, children: 'restart'}
            ]}
            alertOverlay
          >
            <p>Restart your robot to finish the reset. It may take several minutes for your robot to restart.</p>
          </AlertModal>
        </Portal>
      )
    }
    return (
      <Portal>
        <AlertModal
          heading={TITLE}
          buttons={[
            {onClick: this.props.close, children: 'close'},
            {onClick: this.handleReset, children: 'reset'}
          ]}
          alertOverlay
        >
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
        </AlertModal>
      </Portal>
    )
  }
}

export default connect(makeMapStateToProps, mapDispatchToProps)(ResetRobotModal)

function makeMapStateToProps (): (state: State, ownProps: OP) => SP {
  const getResetOptions = makeGetRobotResetOptions()
  const getResetRequest = makeGetRobotResetRequest()
  return (state, ownProps) => {
    const {robot} = ownProps
    const optionsRequest = getResetOptions(state, robot)
    const resetRequest = getResetRequest(state, robot)
    return {
      options: optionsRequest && optionsRequest.response,
      resetRequest
    }
  }
}

function mapDispatchToProps (dispatch: Dispatch, ownProps: OP): DP {
  const {robot} = ownProps
  return {
    fetchOptions: () => dispatch(fetchResetOptions(robot)),
    close: () => dispatch(goBack()),
    reset: (options) => dispatch(resetRobotData(robot, options)),
    restart: () => dispatch(restartRobotServer(robot))
  }
}
