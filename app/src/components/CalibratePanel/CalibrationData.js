// @flow
import * as React from 'react'
import { Flex, Text, DIRECTION_COLUMN, SPACING_2 } from '@opentrons/components'
import { CalibrationValues } from '../CalibrateLabware/CalibrationValues'
import type { LabwareCalibrationData } from '../../calibration/labware/types'

// TODO(bc, 2020-08-03): i18n
const NOT_CALIBRATED = 'Not yet calibrated'
const UPDATED_DATA = 'Updated data'
const EXISTING_DATA = 'Existing data'
const LEGACY_DEFINITION = 'Calibration Data N/A'

export function CalibrationData(props: {|
  calibrationData: LabwareCalibrationData | null,
  calibratedThisSession: boolean,
  calDataAvailable: boolean,
|}): React.Node {
  const { calibrationData, calibratedThisSession, calDataAvailable } = props
  if (!calDataAvailable) {
    return (
      <Text as="i" marginTop={SPACING_2}>
        {LEGACY_DEFINITION}
      </Text>
    )
  } else if (calibrationData === null) {
    return (
      <Text as="i" marginTop={SPACING_2}>
        {NOT_CALIBRATED}
      </Text>
    )
  } else {
    return (
      <Flex flexDirection={DIRECTION_COLUMN} marginTop={SPACING_2}>
        {calibratedThisSession ? UPDATED_DATA : EXISTING_DATA}
        :
        <CalibrationValues {...calibrationData} />
      </Flex>
    )
  }
}
