// @flow
// info panel for labware calibration page
import * as React from 'react'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'
import capitalize from 'lodash/capitalize'

import {
  selectors as robotSelectors,
  actions as robotActions,
} from '../../robot'

import { PrimaryButton } from '@opentrons/components'
import CalibrationInfoBox from '../CalibrationInfoBox'
import CalibrationInfoContent from '../CalibrationInfoContent'

import type { Mount, Labware, LabwareType } from '../../robot'
import type { State, Dispatch } from '../../types'

// TODO(mc, 2018-02-05): match screens instead of using this old component
// import ConfirmCalibrationPrompt from '../deck/ConfirmCalibrationPrompt'

type OP = {| labware: ?Labware |}

type SP = {|
  _buttonTarget: ?Labware,
  _buttonTargetIsNext: boolean,
  _calibratorMount: ?Mount,
|}

type DP = {| dispatch: Dispatch |}

type Props = {
  ...OP,
  button: ?{
    type: LabwareType,
    isNext: boolean,
    isConfirmed: ?boolean,
    onClick: () => void,
  },
}

export default connect<Props, OP, SP, {||}, State, Dispatch>(
  mapStateToProps,
  null,
  mergeProps
)(InfoBox)

function InfoBox(props: Props) {
  const { labware, button } = props
  let title = 'No labware selected'
  let confirmed = false
  let description = 'Please select labware to continue'
  let showButton = false
  let buttonText = ''

  if (labware) {
    const labwareType = robotSelectors.labwareType(labware)

    title = labware.type
    confirmed = labware.confirmed
    description = confirmed
      ? `${capitalize(labwareType)} is calibrated`
      : `${capitalize(labwareType)} is not yet calibrated`

    if (button) {
      showButton = !labware.isMoving
      if (button.isNext) {
        buttonText = `Move to next ${button.type}`
      } else if (!button.isConfirmed) {
        buttonText = `Move to ${button.type}`
      } else {
        buttonText = 'return tip and proceed to run'
      }
    }
  }

  return (
    <CalibrationInfoBox confirmed={confirmed} title={title}>
      <CalibrationInfoContent
        leftChildren={<p>{description}</p>}
        rightChildren={
          button &&
          showButton && (
            <PrimaryButton onClick={button.onClick}>{buttonText}</PrimaryButton>
          )
        }
      />
    </CalibrationInfoBox>
  )
}

function mapStateToProps(state: State, ownProps: OP): SP {
  const { labware } = ownProps
  const _nextLabware =
    !labware || labware.calibration === 'confirmed'
      ? robotSelectors.getNextLabware(state)
      : null

  const _buttonTarget = _nextLabware || labware
  let _calibratorMount = robotSelectors.getCalibratorMount(state)

  if (_buttonTarget && _buttonTarget.calibratorMount) {
    _calibratorMount = _buttonTarget.calibratorMount
  }

  return {
    _calibratorMount,
    _buttonTarget,
    _buttonTargetIsNext:
      _buttonTarget != null && _buttonTarget === _nextLabware,
  }
}

function mergeProps(stateProps: SP, dispatchProps: DP, ownProps: OP): Props {
  const { _buttonTarget, _buttonTargetIsNext, _calibratorMount } = stateProps
  const { dispatch } = dispatchProps
  const targetConfirmed = _buttonTarget && _buttonTarget.confirmed

  let button = null

  if (_buttonTarget) {
    button = {
      type: robotSelectors.labwareType(_buttonTarget),
      isNext: _buttonTargetIsNext,
      isConfirmed: targetConfirmed,
      onClick: () => {
        if (_calibratorMount && (_buttonTargetIsNext || !targetConfirmed)) {
          dispatch(robotActions.moveTo(_calibratorMount, _buttonTarget.slot))
          dispatch(push(`/calibrate/labware/${_buttonTarget.slot}`))
        } else if (_calibratorMount) {
          // $FlowFixMe: robotActions.returnTip is not typed
          dispatch(robotActions.returnTip(_calibratorMount))
          dispatch(push(`/run`))
        }
      },
    }
  }

  return { ...ownProps, button }
}
