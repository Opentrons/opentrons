// @flow
// Card for displaying/initiating factory calibration
import * as React from 'react'
import { connect } from 'react-redux'
import { push } from 'connected-react-router'

import { Card, OutlineButton } from '@opentrons/components'
import { CONNECTABLE } from '../../discovery'
import { startDeckCalibration } from '../../http-api-client'
import { CardContentFlex, CardContentFull } from '../layout'

import type { Dispatch } from '../../types'
import type { ViewableRobot } from '../../discovery/types'

type OP = {|
  robot: ViewableRobot,
  calibrateDeckUrl: string,
  disabled: boolean,
|}

type DP = {|
  start: () => mixed,
|}

type Props = { ...OP, ...DP }

const TITLE = 'Deck Calibration'
// const LAST_RUN_LABEL = 'Last Run'
const CALIBRATION_MESSAGE =
  'Calibrate your robot to initial factory settings to ensure accuracy.'

export const CalibrationCard: React.AbstractComponent<OP> = connect<
  Props,
  OP,
  _,
  _,
  _,
  _
>(
  null,
  mapDispatchToProps
)(CalibrationCardComponent)

function CalibrationCardComponent(props: Props) {
  const { start, robot } = props
  const disabled = robot.status !== CONNECTABLE

  return (
    <Card title={TITLE} disabled={disabled}>
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
        <OutlineButton onClick={start} disabled={disabled}>
          Calibrate
        </OutlineButton>
      </CardContentFlex>
    </Card>
  )
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: OP): DP {
  const { robot, calibrateDeckUrl } = ownProps

  return {
    start: () =>
      dispatch(startDeckCalibration(robot)).then(() =>
        dispatch(push(calibrateDeckUrl))
      ),
  }
}
