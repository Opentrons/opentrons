// @flow
import * as React from 'react'
import {type Dispatch} from 'redux'
import {connect} from 'react-redux'
import CalibrationInfoContent from '../CalibrationInfoContent'
import {PrimaryButton} from '@opentrons/components'

import attachSingle from '../../img/attach_tip_single.png'
import attachMulti from '../../img/attach_tip_multi.png'

import {
  actions as robotActions,
  type Mount,
  type Channels,
} from '../../robot'

type OwnProps = {
  mount: Mount,
  channels: Channels,
  volume: number,
}

type DispatchProps = {
  onProbeTipClick: () => void,
}

export default connect(null, mapDispatchToProps)(AttachTipPanel)

function AttachTipPanel (props: OwnProps & DispatchProps) {
  const {volume, channels, onProbeTipClick} = props

  const leftChildren = (
    <div>
      <p>
        Place a spare
        <em>{` ${volume} μL `}</em>
        tip on pipette before continuing
      </p>
      <PrimaryButton onClick={onProbeTipClick}>
        Confirm Tip Attached
      </PrimaryButton>
    </div>
  )

  const imgSrc = channels === 1
    ? attachSingle
    : attachMulti

  const rightChildren = <img src={imgSrc} alt='attach tip' />

  return (
    <CalibrationInfoContent
      leftChildren={leftChildren}
      rightChildren={rightChildren}
    />
  )
}

function mapDispatchToProps (
  dispatch: Dispatch<*>,
  ownProps: OwnProps
): DispatchProps {
  const mount = ownProps.mount

  return {
    onProbeTipClick: () => { dispatch(robotActions.probeTip(mount)) },
  }
}
