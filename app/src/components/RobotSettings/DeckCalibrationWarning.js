// @flow
import * as React from 'react'
import {
  Icon,
  Box,
  Flex,
  Text,
  FONT_SIZE_BODY_1,
  COLOR_WARNING,
  COLOR_ERROR,
  SIZE_2,
  SPACING_AUTO,
  SPACING_1,
  SPACING_2,
  ALIGN_CENTER,
} from '@opentrons/components'

import * as Calibration from '../../calibration'

import type { StyleProps } from '@opentrons/components'
import type { DeckCalibrationStatus } from '../../calibration/types'

export type DeckCalibrationWarningProps = {|
  deckCalibrationStatus: DeckCalibrationStatus | null,
  ...StyleProps,
|}

const ROBOT_CAL_WARNING = "This robot's deck has not yet been calibrated."
const ROBOT_CAL_ERROR =
  'Bad deck calibration detected! This robot is likely to experience a crash.'
const ROBOT_CAL_RESOLUTION =
  'Please perform a deck calibration prior to uploading a protocol.'

export function DeckCalibrationWarning({
  deckCalibrationStatus: status,
  ...styleProps
}: DeckCalibrationWarningProps): React.Node {
  if (status === null || status === Calibration.DECK_CAL_STATUS_OK) {
    return null
  }

  const isNoCalibration = status === Calibration.DECK_CAL_STATUS_IDENTITY
  const message = isNoCalibration ? ROBOT_CAL_WARNING : ROBOT_CAL_ERROR
  const color = isNoCalibration ? COLOR_WARNING : COLOR_ERROR

  return (
    <Flex alignItems={ALIGN_CENTER} color={color} {...styleProps}>
      <Box size={SIZE_2} paddingY={SPACING_1} paddingRight={SPACING_2}>
        <Icon name="alert-circle" />
      </Box>
      <Box
        fontSize={FONT_SIZE_BODY_1}
        paddingRight={SPACING_1}
        marginRight={SPACING_AUTO}
      >
        <Text>{message}</Text>
        <Text>{ROBOT_CAL_RESOLUTION}</Text>
      </Box>
    </Flex>
  )
}
