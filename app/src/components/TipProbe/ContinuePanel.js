// @flow
import * as React from 'react'
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'

import {PrimaryButton} from '@opentrons/components'
import CalibrationInfoContent from '../CalibrationInfoContent'

import {selectors as robotSelectors} from '../../robot'

type StateProps = {
  done: boolean,
  _button: ?{
    href: string,
    text: string
  }
}

type DispatchProps = {
  dispatch: Dispatch<*>
}

type RemoveTipProps = {
  done: boolean,
  button: ?{
    text: string,
    onClick: () => void
  }
}

export default connect(mapStateToProps, null, mergeProps)(RemoveTipPanel)

function RemoveTipPanel (props: RemoveTipProps) {
  const {done, button} = props

  return (
    <CalibrationInfoContent leftChildren={(
      <div>
        <p>Pipette tip has been calibrated.</p>
        {done && (
          <p>Replace trash bin on top of tip probe before continuing</p>
        )}
        {button && (
          <PrimaryButton onClick={button.onClick}>
            {button.text}
          </PrimaryButton>
        )}
        {!button && (
          <p>
            Your protocol is ready to run!
          </p>
        )}
      </div>
    )} />
  )
}

function mapStateToProps (state): StateProps {
  const instruments = robotSelectors.getInstruments(state)
  const nextLabware = robotSelectors.getNextLabware(state)
  const nextInstrument = instruments.find((inst) => !inst.probed)

  let _button = null

  if (nextInstrument) {
    _button = {
      href: `/setup-instruments/${nextInstrument.mount}`,
      text: 'Continue to Next Pipette'
    }
  } else if (nextLabware) {
    _button = {
      href: `/setup-deck/${nextLabware.slot}`,
      text: 'Continue to Labware setup'
    }
  }

  return {_button, done: nextInstrument == null}
}

function mergeProps (
  stateProps: StateProps,
  dispatchProps: DispatchProps
): RemoveTipProps {
  const {done, _button} = stateProps
  const {dispatch} = dispatchProps

  return {
    done,
    button: _button && {
      text: _button.text,
      onClick: () => dispatch(push(_button.href))
    }
  }
}
