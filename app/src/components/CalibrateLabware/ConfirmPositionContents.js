// @flow
// container for position confirmation logic in ConfirmationModal
import * as React from 'react'
import { connect } from 'react-redux'

import type { Dispatch } from '../../types'
import type { Pipette, Labware } from '../../robot'

import { actions as robotActions } from '../../robot'
import { PrimaryButton } from '@opentrons/components'
import { ConfirmPositionDiagram } from './ConfirmPositionDiagram'
import { JogControls } from '../JogControls'

import type { Jog } from '../JogControls'

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

type Props = {| ...OP, ...DP |}

export const ConfirmPositionContents: React.AbstractComponent<OP> = connect<
  Props,
  OP,
  _,
  _,
  _,
  _
>(
  null,
  mapDispatchToProps
)(ConfirmPositionContentsComponent)

function ConfirmPositionContentsComponent(props: Props) {
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
