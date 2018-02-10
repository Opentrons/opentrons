// @flow
// container for position confirmation logic in ConfirmationModal
import * as React from 'react'
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'

import {
  actions as robotActions,
  type Instrument,
  type Labware,
  type Axis,
  type Direction,
  type JogButtonName
} from '../../robot'

import {PrimaryButton} from '@opentrons/components'

import ConfirmPositionDiagram from './ConfirmPositionDiagram'
import JogControls, {type JogControlsProps} from './JogControls'

type OwnProps = Labware & {
  calibrator: Instrument
}

type DispatchProps = JogControlsProps & {
  onConfirmClick: () => void
}

type Props = OwnProps & DispatchProps

export default connect(null, mapDispatchToProps)(ConfirmPositionContents)

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

const JOG_BUTTONS: Array<{
  name: JogButtonName,
  axis: Axis,
  direction: Direction
}> = [
  {name: 'left', axis: 'x', direction: -1},
  {name: 'right', axis: 'x', direction: 1},
  {name: 'back', axis: 'y', direction: 1},
  {name: 'forward', axis: 'y', direction: -1},
  {name: 'up', axis: 'z', direction: 1},
  {name: 'down', axis: 'z', direction: -1}
]

function mapDispatchToProps (
  dispatch: Dispatch<*>,
  ownProps: OwnProps
): Props {
  const {slot, isTiprack, calibrator: {mount}} = ownProps

  const jogButtons = JOG_BUTTONS.map((button) => {
    const {name, axis, direction} = button
    const onClick = () => {
      dispatch(robotActions.jog(mount, axis, direction))
    }

    return {name, onClick}
  })

  const onConfirmAction = isTiprack
    ? robotActions.pickupAndHome(mount, slot)
    : robotActions.updateOffset(mount, slot)

  return {
    ...ownProps,
    jogButtons,
    onConfirmClick: () => { dispatch(onConfirmAction) }
  }
}
