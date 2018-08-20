// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {goBack} from 'react-router-redux'
import type {Dispatch} from '../../types'
import type {Robot} from '../../robot'

import {AlertModal} from '@opentrons/components'
import {Portal} from '../portal'
import {LabeledToggle} from '../controls'

type OP = {
  robot: Robot
}

type DP = {
  cancel: () => mixed,
  reset: () => mixed,
}

type State = {
  deckCalibration: boolean,
  labwareCalibration: boolean,
  tipProbe: boolean,
  bootScripts: boolean,
}

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

class ResetRobotModal extends React.Component<DP, State> {
  constructor (props: DP) {
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
        {MOCK_RESET_OPTIONS.map(o => (
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

export default connect(null, mapDispatchToProps)(ResetRobotModal)

function mapDispatchToProps (dispatch: Dispatch, ownProps: OP): DP {
  return {
    cancel: () => dispatch(goBack()),
    reset: () => dispatch(goBack())
  }
}
