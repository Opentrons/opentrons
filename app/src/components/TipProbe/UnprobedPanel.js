// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'

import CalibrationInfoContent from '../CalibrationInfoContent'
import { PrimaryButton } from '@opentrons/components'

import {
  actions as robotActions,
  selectors as robotSelectors,
} from '../../robot'

import type { State, Dispatch } from '../../types'
import type { TipProbeProps } from './types'

type OP = TipProbeProps

type SP = {| _showContinueModal: boolean |}

type DP = {| dispatch: Dispatch |}

type Props = {| ...OP, onPrepareClick: () => void |}

export default connect<Props, OP, SP, {||}, State, Dispatch>(
  mapStateToProps,
  null,
  mergeProps
)(UnprobedPanel)

function UnprobedPanel(props: Props) {
  const { probed, onPrepareClick } = props

  const message = !probed
    ? 'Pipette tip is not calibrated'
    : 'Pipette tip is calibrated'

  const buttonText = !probed ? 'Calibrate Tip' : 'Recalibrate Tip'

  const leftChildren = (
    <div>
      <p>{message}</p>
      <PrimaryButton onClick={onPrepareClick}>{buttonText}</PrimaryButton>
    </div>
  )

  return <CalibrationInfoContent leftChildren={leftChildren} />
}

function mapStateToProps(state, ownProps: OP): SP {
  const deckPopulated = robotSelectors.getDeckPopulated(state)

  return {
    _showContinueModal: deckPopulated || deckPopulated == null,
  }
}

function mergeProps(stateProps: SP, dispatchProps: DP, ownProps: OP): Props {
  const { _showContinueModal } = stateProps
  const { dispatch } = dispatchProps
  const { mount, confirmTipProbeUrl } = ownProps

  const onPrepareClick = _showContinueModal
    ? () => {
        dispatch(push(confirmTipProbeUrl))
      }
    : () => {
        // $FlowFixMe: robotActions.moveToFront is not typed
        dispatch(robotActions.moveToFront(mount))
      }

  return {
    ...ownProps,
    onPrepareClick,
  }
}
