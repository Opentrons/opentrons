// container for position confirmation logic in ConfirmationModal
import * as React from 'react'
import { connect } from 'react-redux'

import type { Pipette, Labware } from '../../../redux/robot'

import { actions as robotActions } from '../../../redux/robot'
import { PrimaryButton } from '@opentrons/components'
import { ConfirmPositionDiagram } from './ConfirmPositionDiagram'
import { JogControls } from '../../../molecules/JogControls'

import type { MapDispatchToProps } from 'react-redux'
import type { Jog } from '../../../molecules/JogControls'

interface OP {
  labware: Labware
  calibrator: Pipette
  calibrateToBottom: boolean
  useCenteredTroughs: boolean
}

interface DP {
  onConfirmClick: () => unknown
  jog: Jog
}

type Props = OP & DP

function ConfirmPositionContentsComponent(props: Props): JSX.Element {
  const {
    jog,
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
      <JogControls jog={jog} />
      <PrimaryButton title="confirm" onClick={onConfirmClick}>
        {confirmButtonText}
      </PrimaryButton>
    </div>
  )
}

const mapDispatchToProps: MapDispatchToProps<DP, OP> = (dispatch, ownProps) => {
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

export const ConfirmPositionContents = connect(
  null,
  mapDispatchToProps
)(ConfirmPositionContentsComponent)
