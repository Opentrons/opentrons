// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'

import type {PipetteConfig} from '@opentrons/labware-definitions'
import type {Mount} from '../../robot'
import type {CalibrateDeckProps} from './types'

import {
  moveRobotTo,
  deckCalibrationCommand as dcCommand
} from '../../http-api-client'

import ClearDeckAlertModal from '../ClearDeckAlertModal'

type OP = CalibrateDeckProps & {
  pipette: PipetteConfig,
  mount: Mount
}

type DP = {
  onContinue: () => mixed,
  onCancel: () => mixed,
}

type Props = OP & DP

export default connect(null, mapDispatchToProps)(ClearDeckAlert)

function ClearDeckAlert (props: Props) {
  return (
    <ClearDeckAlertModal
      parentUrl={props.parentUrl}
      cancelText='cancel'
      continueText='move pipette to front'
      onCancelClick={props.onCancel}
      onContinueClick={props.onContinue}
    />
  )
}

function mapDispatchToProps (dispatch: Dispatch, ownProps: OP): DP {
  const {robot, mount, pipette, match: {url}} = ownProps

  return {
    onContinue: () => {
      dispatch(push(`${url}/step-1`))
      dispatch(moveRobotTo(robot, {position: 'attach_tip', mount, pipette}))
    },
    onCancel: () => dispatch(dcCommand(robot, {command: 'release'}))
  }
}
