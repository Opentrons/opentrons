// @flow
import * as React from 'react'
import { Flex, Text, DIRECTION_COLUMN, SPACING_2 } from '@opentrons/components'
import { CalibrationValues } from '../CalibrateLabware/CalibrationValues'
import type { LabwareCalibrationData } from '../../calibration/labware/types'

// TODO(bc, 2020-08-03): i18n
const NOT_CALIBRATED = 'Not yet calibrated'
const UPDATED_DATA = 'Updated data'
const EXISTING_DATA = 'Existing data'

export function CalibrationData(props: {|
  calibrationData: LabwareCalibrationData | null,
  calibratedThisSession: boolean,
|}): React.Node {
  const { calibrationData, calibratedThisSession } = props
  if (calibrationData === null && !calibratedThisSession) {
    return (
      <Text as="i" marginTop={SPACING_2}>
        {NOT_CALIBRATED}
      </Text>
    )
  } else if (calibrationData) {
    return (
      <Flex flexDirection={DIRECTION_COLUMN} marginTop={SPACING_2}>
        {calibratedThisSession ? UPDATED_DATA : EXISTING_DATA}
        :
        <CalibrationValues {...calibrationData} />
      </Flex>
    )
  } else {
    // NOTE: this case should never be reached as calibrationData will never be null
    // at the same time that calibratedThisSession is truthy
    return null
  }
}
