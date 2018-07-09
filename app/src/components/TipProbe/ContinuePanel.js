// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {Link} from 'react-router-dom'

import type {State} from '../../types'
import {PrimaryButton} from '@opentrons/components'
import CalibrationInfoContent from '../CalibrationInfoContent'

import {selectors as robotSelectors} from '../../robot'

type SP = {
  done: boolean,
  buttonText: string,
}

type Props = SP

export default connect(mapStateToProps)(RemoveTipPanel)

function RemoveTipPanel (props: Props) {
  const {done, buttonText} = props

  return (
    <CalibrationInfoContent leftChildren={(
      <div>
        <p>Pipette tip has been calibrated.</p>
        {done && (
          <p>Replace trash bin on top of tip probe before continuing</p>
        )}
        {/* redirect for next pipette or labware lives in /calibrate */}
        <PrimaryButton Component={Link} to='/calibrate'>
          {buttonText}
        </PrimaryButton>
      </div>
    )} />
  )
}

function mapStateToProps (state: State): SP {
  const instruments = robotSelectors.getPipettes(state)
  const nextInstrument = instruments.find((inst) => !inst.probed)
  const buttonText = nextInstrument
    ? 'Continue to next pipette'
    : 'Continue to labware setup'

  return {buttonText, done: nextInstrument == null}
}
