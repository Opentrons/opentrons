// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import { PrimaryButton } from '@opentrons/components'
import { CalibrationInfoContent } from '../CalibrationInfoContent'
import { selectors as robotSelectors } from '../../robot'

import type { State, Dispatch } from '../../types'
import type { TipProbeProps } from './types'

type OP = TipProbeProps

type SP = {|
  done: boolean,
  buttonText: string,
|}

type Props = {| ...OP, ...SP, dispatch: Dispatch |}

export const ContinuePanel = connect<Props, OP, SP, _, _, _, _>(
  mapStateToProps
)(ContinuePanelComponent)

function ContinuePanelComponent(props: Props) {
  const { done, buttonText } = props

  return (
    <CalibrationInfoContent
      leftChildren={
        <div>
          <p>Pipette tip has been calibrated.</p>
          {done && (
            <p>Replace trash bin on top of tip probe before continuing</p>
          )}
          {/* redirect for next pipette or labware lives in /calibrate */}
          <PrimaryButton Component={Link} to="/calibrate">
            {buttonText}
          </PrimaryButton>
        </div>
      }
    />
  )
}

function mapStateToProps(state: State): SP {
  const pipettes = robotSelectors.getPipettes(state)
  const nextPipette = pipettes.find(pipette => !pipette.probed)
  const buttonText = nextPipette
    ? 'Continue to next pipette'
    : 'Continue to labware setup'

  return { buttonText, done: nextPipette == null }
}
