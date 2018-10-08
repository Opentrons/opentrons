// @flow
import * as React from 'react'
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'

import CalibrationInfoContent from '../CalibrationInfoContent'
import {PrimaryButton} from '@opentrons/components'

import {
  actions as robotActions,
  selectors as robotSelectors,
  type Mount,
} from '../../robot'

type OwnProps = {
  mount: Mount,
  probed: boolean,
  confirmTipProbeUrl: string,
}

type StateProps = {
  _showContinueModal: boolean,
}

type DispatchProps = {
  dispatch: Dispatch<*>,
}

type Props = {
  probed: boolean,
  onPrepareClick: () => void,
}

export default connect(mapStateToProps, null, mergeProps)(UnprobedPanel)

function UnprobedPanel (props: Props) {
  const {probed, onPrepareClick} = props

  const message = !probed
    ? 'Pipette tip is not calibrated'
    : 'Pipette tip is calibrated'

  const buttonText = !probed
    ? 'Calibrate Tip'
    : 'Recalibrate Tip'

  const leftChildren = (
    <div>
      <p>
        {message}
      </p>
      <PrimaryButton onClick={onPrepareClick}>
        {buttonText}
      </PrimaryButton>
    </div>
  )

  return (
    <CalibrationInfoContent leftChildren={leftChildren} />
  )
}

function mapStateToProps (state, ownProps: OwnProps): StateProps {
  const deckPopulated = robotSelectors.getDeckPopulated(state)

  return {
    _showContinueModal: deckPopulated || deckPopulated == null,
  }
}

function mergeProps (
  stateProps: StateProps,
  dispatchProps: DispatchProps,
  ownProps: OwnProps
): Props {
  const {_showContinueModal} = stateProps
  const {dispatch} = dispatchProps
  const {mount, confirmTipProbeUrl} = ownProps

  const onPrepareClick = _showContinueModal
    ? () => { dispatch(push(confirmTipProbeUrl)) }
    : () => { dispatch(robotActions.moveToFront(mount)) }

  return {
    ...ownProps,
    onPrepareClick,
  }
}
