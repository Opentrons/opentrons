// @flow
// container for position confirmation logic in ConfirmationModal
import * as React from 'react'
import {connect} from 'react-redux'

import type {State, Dispatch} from '../../types'
import type {Instrument, Labware} from '../../robot'

import {selectors as robotSelectors, actions as robotActions} from '../../robot'
import {PrimaryButton} from '@opentrons/components'
import ConfirmPositionDiagram from './ConfirmPositionDiagram'
import JogControls, {type JogControlsProps} from '../JogControls'

type SP = {
  step: $PropertyType<JogControlsProps, 'step'>,
}

type DP = {
  onConfirmClick: () => void,
  jog: $PropertyType<JogControlsProps, 'jog'>,
  onStepSelect: $PropertyType<JogControlsProps, 'onStepSelect'>,
}

type OP = Labware & {
  calibrator: Instrument
}

type Props = SP & DP & OP

export default connect(mapStateToProps, mapDispatchToProps)(ConfirmPositionContents)

function ConfirmPositionContents (props: Props) {
  const {isTiprack, onConfirmClick, calibrator: {channels}} = props
  const confirmButtonText = isTiprack
    ? `pick up tip${channels === 8 ? 's' : ''}`
    : 'save calibration'

  return (
    <div>
      <ConfirmPositionDiagram {...props} buttonText={confirmButtonText} />
      <JogControls {...props} />
      <PrimaryButton title='confirm' onClick={onConfirmClick}>
        {confirmButtonText}
      </PrimaryButton>
    </div>
  )
}

function mapStateToProps (state: State): SP {
  return {
    step: robotSelectors.getJogDistance(state)
  }
}

function mapDispatchToProps (dispatch: Dispatch, ownProps: OP): DP {
  const {slot, isTiprack, calibrator: {mount}} = ownProps
  const onConfirmAction = isTiprack
    ? robotActions.pickupAndHome(mount, slot)
    : robotActions.updateOffset(mount, slot)

  return {
    jog: (axis, direction) => {
      dispatch(robotActions.jog(mount, axis, direction))
    },
    onStepSelect: (event) => {
      const step = Number(event.target.value)
      dispatch(robotActions.setJogDistance(step))
    },
    onConfirmClick: () => { dispatch(onConfirmAction) }
  }
}
