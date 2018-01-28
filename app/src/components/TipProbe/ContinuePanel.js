// @flow
import * as React from 'react'
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'

import {PrimaryButton} from '@opentrons/components'
import CalibrationInfoContent from '../CalibrationInfoContent'

import {selectors as robotSelectors} from '../../robot'

type StateProps = {
  _button: ?{
    href: string,
    text: string
  }
}

type DispatchProps = {
  dispatch: Dispatch<*>
}

type RemoveTipProps = {
  button: ?{
    text: string,
    onClick: () => void
  }
}

export default connect(mapStateToProps, null, mergeProps)(RemoveTipPanel)

function RemoveTipPanel (props: RemoveTipProps) {
  const {button} = props

  // TODO(mc, 2018-01-22): needed to quickly work around the case of
  //   no-next-labware; rethink this display after talking to UX
  const leftChildren = (
    <div>
      <p>Pipette tip has been calibrated.</p>
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
  )

  return (
    <CalibrationInfoContent
      leftChildren={leftChildren}
    />
  )
}

function mapStateToProps (state): StateProps {
  const instruments = robotSelectors.getInstruments(state)
  const nextLabware = robotSelectors.getNextLabware(state)
  const nextInstrument = instruments
    .find((inst) => inst.name && !inst.probed)

  let _button = null

  if (nextInstrument) {
    _button = {
      href: `/setup-instruments/${nextInstrument.mount}`,
      text: 'Continue to Next Pipette'
    }
  } else if (nextLabware) {
    _button = {
      href: `/setup-deck/${nextLabware.slot}`,
      text: 'Continue to Labeware setup'
    }
  }

  return {_button}
}

function mergeProps (
  stateProps: StateProps,
  dispatchProps: DispatchProps
): RemoveTipProps {
  const {_button} = stateProps
  const {dispatch} = dispatchProps

  return {
    button: _button && {
      text: _button.text,
      onClick: () => dispatch(push(_button.href))
    }
  }
}
