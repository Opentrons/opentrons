// @flow
import * as React from 'react'
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'

import {PrimaryButton} from '@opentrons/components'
import CalibrationInfoContent from '../CalibrationInfoContent'

import removeSingle from '../../img/remove_tip_single.png'
import removeMulti from '../../img/remove_tip_multi.png'

import {
  actions as robotActions,
  type Channels,
  type Mount,
} from '../../robot'

type OwnProps = {
  mount: Mount,
  channels: Channels,
}

type DispatchProps = {
  onConfirmClick: () => void,
}

type RemoveTipProps = {
  channels: Channels,
  onConfirmClick: () => void,
}

export default connect(null, mapDispatchToProps)(RemoveTipPanel)

function RemoveTipPanel (props: RemoveTipProps) {
  const {channels, onConfirmClick} = props

  const imgSrc = channels === 1
    ? removeSingle
    : removeMulti

  return (
    <CalibrationInfoContent
      leftChildren={(
        <div>
          <p>Remove tip from pipette.</p>
          <PrimaryButton onClick={onConfirmClick}>
            Confirm Tip Removed
          </PrimaryButton>
        </div>
      )}
      rightChildren={(
        <img src={imgSrc} alt='remove tip' />
      )}
    />
  )
}

function mapDispatchToProps (
  dispatch: Dispatch<*>,
  ownProps: OwnProps
): DispatchProps {
  const {mount} = ownProps

  return {
    onConfirmClick: () => { dispatch(robotActions.confirmProbed(mount)) },
  }
}
