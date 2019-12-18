// @flow
// container for position confirmation logic in ConfirmationModal
import * as React from 'react'
import { connect } from 'react-redux'

import type { Dispatch } from '../../types'
import type { Pipette, Labware } from '../../robot'

import { actions as robotActions } from '../../robot'
import { PrimaryButton } from '@opentrons/components'
import { ConfirmPositionDiagram } from './ConfirmPositionDiagram'
import JogControls, { type Jog } from '../JogControls'

type OP = {|
  labware: Labware,
  calibrator: Pipette,
  calibrateToBottom: boolean,
  useCenteredTroughs: boolean,
|}

type DP = {|
  onConfirmClick: () => mixed,
  jog: Jog,
|}

type Props = { ...OP, ...DP }

export default connect<Props, OP, _, _, _, _>(
  null,
  mapDispatchToProps
)(ConfirmPositionContents)

function ConfirmPositionContents(props: Props) {
  const {
    onConfirmClick,
    labware,
    calibrator,
    calibrateToBottom,
    useCenteredTroughs,
  } = props

  const confirmButtonText = labware.isTiprack
    ? `pick up tip${calibrator.channels === 8 ? 's' : ''}`
    : 'save calibration'

  return (
    <div>
      <ConfirmPositionDiagram
        {...{ labware, calibrator, calibrateToBottom, useCenteredTroughs }}
        buttonText={confirmButtonText}
      />
      <JogControls {...props} />
      <PrimaryButton title="confirm" onClick={onConfirmClick}>
        {confirmButtonText}
      </PrimaryButton>
    </div>
  )
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: OP): DP {
  const { slot, isTiprack } = ownProps.labware
  const { mount } = ownProps.calibrator

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
