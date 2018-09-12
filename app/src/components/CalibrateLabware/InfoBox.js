// @flow
// info panel for labware calibration page
import * as React from 'react'
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'
import capitalize from 'lodash/capitalize'

import {
  selectors as robotSelectors,
  actions as robotActions,
  type Mount,
  type Labware,
  type LabwareType,
} from '../../robot'

import {PrimaryButton} from '@opentrons/components'
import CalibrationInfoBox from '../CalibrationInfoBox'
import CalibrationInfoContent from '../CalibrationInfoContent'

// TODO(mc, 2018-02-05): match screens instead of using this old component
// import ConfirmCalibrationPrompt from '../deck/ConfirmCalibrationPrompt'

type OwnProps = {
  labware: ?Labware,
}

type StateProps = {
  _buttonTarget: ?Labware,
  _buttonTargetIsNext: boolean,
  _calibratorMount: ?Mount,
}

type DispatchProps = {
  dispatch: Dispatch<*>,
}

type Props = OwnProps & {
  button: ?{
    type: LabwareType,
    isNext: boolean,
    isConfirmed: ?boolean,
    onClick: () => void,
  },
}

export default connect(mapStateToProps, null, mergeProps)(InfoBox)

function InfoBox (props: Props) {
  const {labware, button} = props
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
        leftChildren={(
          <p>
            {description}
          </p>
        )}
        rightChildren={(
          button && showButton && (
            <PrimaryButton onClick={button.onClick}>
              {buttonText}
            </PrimaryButton>
          )
        )}
      />
    </CalibrationInfoBox>
  )
}

function mapStateToProps (state, ownProps: OwnProps): StateProps {
  const {labware} = ownProps
  const _nextLabware = !labware || labware.calibration === 'confirmed'
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
    _buttonTargetIsNext: (
      _buttonTarget != null &&
      _buttonTarget === _nextLabware
    ),
  }
}

function mergeProps (
  stateProps: StateProps,
  dispatchProps: DispatchProps,
  ownProps: OwnProps
): Props {
  const {_buttonTarget, _buttonTargetIsNext, _calibratorMount} = stateProps
  const {dispatch} = dispatchProps
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
          dispatch(robotActions.returnTip(_calibratorMount))
          dispatch(push(`/run`))
        }
      },
    }
  }

  return {...ownProps, button}
}
