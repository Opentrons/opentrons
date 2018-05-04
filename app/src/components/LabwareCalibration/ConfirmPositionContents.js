// @flow
// container for position confirmation logic in ConfirmationModal
import * as React from 'react'
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'

import {
  selectors as robotSelectors,
  actions as robotActions,
  type Instrument,
  type Labware
} from '../../robot'

import {PrimaryButton} from '@opentrons/components'

import ConfirmPositionDiagram from './ConfirmPositionDiagram'
import JogControls, {type JogControlsProps} from '../JogControls'

type StateProps = {
  currentJogDistance: number
}

type OwnProps = Labware & {
  calibrator: Instrument
}

type DispatchProps = JogControlsProps & {
  onConfirmClick: () => void,
  onIncrementSelect: (event: SyntheticInputEvent<>) => mixed,
}

type Props = OwnProps & DispatchProps

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

function mapStateToProps (state): StateProps {
  return {
    currentJogDistance: robotSelectors.getJogDistance(state)
  }
}

function mapDispatchToProps (
  dispatch: Dispatch<*>,
  ownProps: OwnProps
): any {
  const {slot, isTiprack, calibrator: {mount}} = ownProps

  const makeJog = (axis, direction) => () => {
    dispatch(robotActions.jog(mount, axis, direction))
  }

  const onConfirmAction = isTiprack
    ? robotActions.pickupAndHome(mount, slot)
    : robotActions.updateOffset(mount, slot)

  return {
    ...ownProps,
    makeJog,
    onIncrementSelect: (event) => {
      const step = Number(event.target.value)
      dispatch(robotActions.setJogDistance(step))
    },
    onConfirmClick: () => { dispatch(onConfirmAction) }
  }
}
