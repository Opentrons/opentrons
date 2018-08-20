// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {goBack} from 'react-router-redux'
import type {State, Dispatch} from '../../types'
import type {Robot} from '../../robot'
import type {Option} from '../../http-api-client'
import {fetchResetOptions, makeGetRobotResetOptions} from '../../http-api-client'
import {AlertModal} from '@opentrons/components'
import {Portal} from '../portal'
import {LabeledToggle} from '../controls'

type OP = {
  robot: Robot
}

type SP = {
  options: Array<Option>
}

type DP = {
  fetchOptions: () => mixed,
  cancel: () => mixed,
  reset: () => mixed,
}

type OptionsState = {
  deckCalibration: boolean,
  labwareCalibration: boolean,
  tipProbe: boolean,
  bootScripts: boolean,
}

type Props = SP & DP

const TITLE = 'Robot Factory Reset'

const MOCK_RESET_OPTIONS = [
  {
    id: 'deckCalibration',
    title: 'Deck Calibration',
    description: 'Reset calibration of pipette to deck'
  },
  {
    id: 'tipProbe',
    title: 'Tip Length',
    description: 'Erase tip probe data'
  },
  {
    id: 'labwareCalibration',
    title: 'Labware Calibration',
    description: 'Erase custom labware calibration'
  },
  {
    id: 'bootScripts',
    title: 'Boot Scripts',
    description: 'Erase custom boot scripts'
  }
]

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

  componentDidMount () {
    this.props.fetchOptions()
  }

  render () {
    return (
      <Portal>
        <AlertModal
          heading={TITLE}
          buttons={[
            {onClick: this.props.cancel, children: 'cancel'},
            {onClick: this.props.reset, children: 'reset'}
          ]}
          alertOverlay
        >
        <p>Warning! Clicking <strong>reset</strong> will erase your selected configurations and restore your robot to factory settings. This cannot be undone</p>
        {this.props.options.map(o => (
          <LabeledToggle
            label= {o.title}
            onClick= {this.toggle(o.id)}
            toggledOn={this.state[o.id]}
            key={o.id}>
            <p>{o.description}</p>
          </LabeledToggle>
        ))}
        </AlertModal>
      </Portal>
    )
  }
}

export default connect(makeMapStateToProps, mapDispatchToProps)(ResetRobotModal)

function makeMapStateToProps (): (state: State, ownProps: OP) => SP {
  const getResetOptions = makeGetRobotResetOptions()
  return (state, ownProps) => {
    const {robot} = ownProps
    const optionsRequest = getResetOptions(state, robot)
    const options = optionsRequest && optionsRequest.response && optionsRequest.response.options
    return {
      options: options || MOCK_RESET_OPTIONS
    }
  }
}

function mapDispatchToProps (dispatch: Dispatch, ownProps: OP): DP {
  const {robot} = ownProps
  return {
    fetchOptions: () => dispatch(fetchResetOptions(robot)),
    cancel: () => dispatch(goBack()),
    reset: () => dispatch(goBack())
  }
}
