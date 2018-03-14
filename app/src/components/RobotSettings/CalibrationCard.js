// @flow
// Card for displaying/initiating factory calibration
import * as React from 'react'
import type {Robot} from '../../robot'
import {Card, LabeledValue, OutlineButton} from '@opentrons/components'

type Props = Robot

const TITLE = 'Initial robot calibration'
const LAST_RUN_LABEL = 'Last Run:'
const CALIBRATION_MESSAGE = 'Calibrate your robot to initial factory settings to ensure accuracy.'

export default function CalibrationCard (props: Props) {
  const lastCalibrated = 'never'
  return (
    <Card title={TITLE} description={CALIBRATION_MESSAGE}>
    <LabeledValue
      label={LAST_RUN_LABEL}
      value={lastCalibrated}
    />
    <OutlineButton disabled>
      Calibrate
    </OutlineButton>
    </Card>
  )
}
