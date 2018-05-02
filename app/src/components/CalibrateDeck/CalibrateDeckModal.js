// @flow
import * as React from 'react'
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'

import {type CalibrateDeckProps, type CalibrationStep} from './types'
import {ModalPage, PrimaryButton} from '@opentrons/components'
import JogControls, {type JogControlsProps} from '../JogControls'
import Instructions from './Instructions'

import {
  selectors as robotSelectors,
  actions as robotActions
} from '../../robot'

type OP = {
  calibrationStep: CalibrationStep
}

type StateProps = {
  currentJogDistance: number
}

type DispatchProps = JogControlsProps & {
  onIncrementSelect: (event: SyntheticInputEvent<>) => mixed,
}

type Props = CalibrateDeckProps & DispatchProps & OP

export default connect(mapStateToProps, mapDispatchToProps)(CalibrateDeckModal)

function CalibrateDeckModal (props: Props) {
  const HEADING = props.calibrationStep === 'step-2'
   ? 'Calibrate the z-axis'
   : 'Calibrate the X-Y axis'
  return (
    <ModalPage
      titleBar={{
        title: props.title,
        subtitle: props.subtitle,
        back: {
          onClick: props.back,
          disabled: true
        }
      }}
      heading= {HEADING}
      >
      <Instructions {...props} />
      <JogControls {...props} />
      <PrimaryButton disabled>
        Save Calibration and Continue
      </PrimaryButton>
    </ModalPage>
  )
}

function mapStateToProps (state): StateProps {
  return {
    currentJogDistance: robotSelectors.getJogDistance(state)
  }
}

function mapDispatchToProps (
  dispatch: Dispatch<*>
): any {
  const makeJog = (axis, direction) => () => {
    console.log(axis, direction)
  }

  return {
    makeJog,
    onIncrementSelect: (event) => {
      const step = Number(event.target.value)
      dispatch(robotActions.setJogDistance(step))
    }
  }
}
