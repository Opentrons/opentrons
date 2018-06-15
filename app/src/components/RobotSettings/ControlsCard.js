// @flow
// "Robot Controls" card
import * as React from 'react'
import {connect} from 'react-redux'

import {Card} from '@opentrons/components'
import {LabeledToggle, LabeledButton} from '../controls'

import type {State, Dispatch} from '../../types'
import type {Robot} from '../../robot'

type OP = Robot

type SP = {}

type DP = {}

type Props = OP & SP & DP

const TITLE = 'Robot Controls'

export default connect(makeMakeStateToProps, mapDispatchToProps)(ControlsCard)

function ControlsCard (props: Props) {
  return (
    <Card title={TITLE} column>
      <LabeledToggle label='Lights' toggledOn={false} onClick={() => {}}>
        <p>Control lights on deck.</p>
      </LabeledToggle>
      <LabeledButton
        label='Home all axes'
        buttonProps={{disabled: true, children: 'Home'}}
      >
        <p>Return robot to starting position.</p>
      </LabeledButton>
    </Card>
  )
}

function makeMakeStateToProps (): (state: State, ownProps: OP) => SP {
  return (state, ownProps) => ({})
}

function mapDispatchToProps (dispatch: Dispatch, ownProps: OP): DP {
  return {}
}
