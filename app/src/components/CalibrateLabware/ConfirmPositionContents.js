// @flow
// container for position confirmation logic in ConfirmationModal
import * as React from 'react'
import {connect} from 'react-redux'

import type {Dispatch} from '../../types'
import type {Pipette, Labware} from '../../robot'

import {actions as robotActions} from '../../robot'
import {PrimaryButton} from '@opentrons/components'
import ConfirmPositionDiagram from './ConfirmPositionDiagram'
import JogControls, {type Jog} from '../JogControls'

type DP = {
  onConfirmClick: () => mixed,
  jog: Jog,
}

type OP = Labware & {
  calibrator: Pipette,
  calibrateToBottom: boolean,
}

type Props = DP & OP

export default connect(null, mapDispatchToProps)(ConfirmPositionContents)

function ConfirmPositionContents (props: Props) {
  const {isTiprack, onConfirmClick, calibrator: {channels}} = props
  const confirmButtonText = isTiprack
    ? `pick up tip${channels === 8 ? 's' : ''}`
    : 'save calibration'

  return (
    <div>
      {/* $FlowFixMe: `...props` type doesn't include necessary keys */}
      <ConfirmPositionDiagram {...props} buttonText={confirmButtonText} />
      <JogControls {...props} />
      <PrimaryButton title='confirm' onClick={onConfirmClick}>
        {confirmButtonText}
      </PrimaryButton>
    </div>
  )
}

function mapDispatchToProps (dispatch: Dispatch, ownProps: OP): DP {
  const {slot, isTiprack, calibrator: {mount}} = ownProps
  const onConfirmAction = isTiprack
    ? robotActions.pickupAndHome(mount, slot)
    : robotActions.updateOffset(mount, slot)

  return {
    jog: (axis, direction, step) => {
      dispatch(robotActions.jog(mount, axis, direction, step))
    },
    onConfirmClick: () => dispatch(onConfirmAction),
  }
}
