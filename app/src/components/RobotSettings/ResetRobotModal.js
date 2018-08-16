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
  tipCalibration: boolean,
  bootScripts: boolean,
}

const TITLE = 'Robot Factory Reset'

class ResetRobotModal extends React.Component<DP, State> {
  constructor (props: DP) {
    super(props)

    this.state = {
      deckCalibration: false,
      labwareCalibration: false,
      tipCalibration: false,
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
        {/* TODO (ka 2018-8-17): Rebuild toggles with mock data from #1885 */}
        <LabeledToggle
          label='Deck Calibration'
          onClick={this.toggle('deckCalibration')}
          toggledOn={this.state.deckCalibration}
        >
          <p>Reset calibration of pipette to deck</p>
        </LabeledToggle>

        <LabeledToggle
          label='Labware'
          onClick={this.toggle('labwareCalibration')}
          toggledOn={this.state.labwareCalibration}
        >
          <p>Erase custom labware calibration</p>
        </LabeledToggle>

        <LabeledToggle
          label='Tip Length'
          onClick={this.toggle('tipCalibration')}
          toggledOn={this.state.tipCalibration}
        >
          <p>Erase tip probe data</p>
        </LabeledToggle>

        <LabeledToggle
          label='Boot Scripts'
          onClick={this.toggle('bootScripts')}
          toggledOn={this.state.bootScripts}
        >
          <p>Erase custom boot scripts</p>
        </LabeledToggle>

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
