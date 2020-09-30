// @flow
import * as React from 'react'
import { connect } from 'react-redux'

import { PrimaryButton } from '@opentrons/components'
import { CalibrationInfoContent } from '../CalibrationInfoContent'

import { actions as robotActions } from '../../robot'
import removeSingle from '../../assets/images/remove_tip_single.png'
import removeMulti from '../../assets/images/remove_tip_multi.png'

import type { Dispatch } from '../../types'
import type { TipProbeProps } from './types'

type OP = TipProbeProps

type DP = {| onConfirmClick: () => void |}

type Props = {| ...OP, ...DP |}

export const RemoveTipPanel: React.AbstractComponent<OP> = connect<
  Props,
  OP,
  {||},
  DP,
  _,
  _
>(
  null,
  mapDispatchToProps
)(RemoveTipPanelComponent)

function RemoveTipPanelComponent(props: Props) {
  const { channels, onConfirmClick } = props

  const imgSrc = channels === 1 ? removeSingle : removeMulti

  return (
    <CalibrationInfoContent
      leftChildren={
        <div>
          <p>Remove tip from pipette.</p>
          <PrimaryButton onClick={onConfirmClick}>
            Confirm Tip Removed
          </PrimaryButton>
        </div>
      }
      rightChildren={<img src={imgSrc} alt="remove tip" />}
    />
  )
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: OP): DP {
  const { mount } = ownProps

  return {
    onConfirmClick: () => {
      dispatch(robotActions.confirmProbed(mount))
    },
  }
}
