// @flow
// Card for displaying/initiating factory calibration
import * as React from 'react'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'

import type {Robot} from '../../robot'
import {startDeckCalibration} from '../../http-api-client'
import {Card, OutlineButton} from '@opentrons/components'
import {CardContentFlex, CardContentFull} from '../layout'

type OP = Robot

type DP = {
  start: () => mixed,
}

type Props = OP & DP

const TITLE = 'Deck Calibration'
// const LAST_RUN_LABEL = 'Last Run'
const CALIBRATION_MESSAGE = 'Calibrate your robot to initial factory settings to ensure accuracy.'

export default connect(null, mapDispatchToProps)(CalibrationCard)

function CalibrationCard (props: Props) {
  const {start} = props
  return (
    <Card title={TITLE}>
      <CardContentFull>
        <p>{CALIBRATION_MESSAGE}</p>
      </CardContentFull>
      <CardContentFlex>
        <div>
        {/*
          <LabeledValue
            label={LAST_RUN_LABEL}
            value='Never'
          />
        */}
        </div>
        <OutlineButton onClick={start}>
          Calibrate
        </OutlineButton>
      </CardContentFlex>
    </Card>
  )
}

function mapDispatchToProps (dispatch: Dispatch, ownProps: OP): DP {
  // TODO(mc, 2018-05-08): pass this in as a prop
  const deckCalUrl = `/robots/${ownProps.name}/calibrate-deck`

  return {
    start: () => dispatch(startDeckCalibration(ownProps))
      .then(() => dispatch(push(deckCalUrl))),
  }
}
