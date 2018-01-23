// @flow
import * as React from 'react'
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'
import CalibrationInfoContent from '../CalibrationInfoContent'
import {PrimaryButton} from '@opentrons/components'

import {
  actions as robotActions,
  type Mount
} from '../../robot'

type OwnProps = {
  mount: Mount,
  probed: boolean
}

type DispatchProps = {
  onPrepareClick: () => void
}

export default connect(null, mapDispatchToProps)(UnprobedPanel)

function UnprobedPanel (props: OwnProps & DispatchProps) {
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

function mapDispatchToProps (
  dispatch: Dispatch<*>,
  ownProps: OwnProps
): DispatchProps {
  const mount = ownProps.mount

  // TODO(ka 1-22-18): add in isDeckPopulated modal logic
  return {
    onPrepareClick: () => dispatch(robotActions.moveToFront(mount))
  }
}
