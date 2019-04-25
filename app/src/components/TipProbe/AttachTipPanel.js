// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import CalibrationInfoContent from '../CalibrationInfoContent'
import { PrimaryButton } from '@opentrons/components'

import { actions as robotActions } from '../../robot'
import attachSingle from '../../img/attach_tip_single.png'
import attachMulti from '../../img/attach_tip_multi.png'

import type { Dispatch } from '../../types'
import type { TipProbeProps } from './types'

type OP = TipProbeProps

type DP = {| onProbeTipClick: () => void |}

type Props = { ...OP, ...DP }

export default connect<Props, OP, {||}, DP, _, _>(
  null,
  mapDispatchToProps
)(AttachTipPanel)

function AttachTipPanel(props: Props) {
  const { volume, channels, onProbeTipClick } = props

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

  const imgSrc = channels === 1 ? attachSingle : attachMulti

  const rightChildren = <img src={imgSrc} alt="attach tip" />

  return (
    <CalibrationInfoContent
      leftChildren={leftChildren}
      rightChildren={rightChildren}
    />
  )
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: OP): DP {
  const mount = ownProps.mount

  return {
    onProbeTipClick: () => {
      // $FlowFixMe: robotActions.probeTip is not typed
      dispatch(robotActions.probeTip(mount))
    },
  }
}
