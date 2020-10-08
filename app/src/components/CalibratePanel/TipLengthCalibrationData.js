// @flow
import * as React from 'react'
import {
  Box,
  Flex,
  Text,
  DIRECTION_COLUMN,
  SPACING_2,
} from '@opentrons/components'
import type { TipLengthCalibration } from '../../calibration/api-types'

// TODO(bc, 2020-08-03): i18n
const NOT_CALIBRATED = 'Not yet calibrated'
const EXISTING_DATA = 'Existing data'
const LEGACY_DEFINITION = 'Calibration Data N/A'

export type TipLengthCalibrationDataProps = {|
  calibrationData: TipLengthCalibration | null,
  calDataAvailable: boolean,
|}

export function TipLengthCalibrationData(
  props: TipLengthCalibrationDataProps
): React.Node {
  const { calibrationData, calDataAvailable } = props
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
        {EXISTING_DATA}:
        <Box>{`${calibrationData.tipLength.toFixed(2)} mm`}</Box>
      </Flex>
    )
  }
}
