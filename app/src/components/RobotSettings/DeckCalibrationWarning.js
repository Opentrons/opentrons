// @flow
import * as React from 'react'
import {
  Icon,
  Box,
  Flex,
  Text,
  FONT_SIZE_BODY_1,
  COLOR_ERROR,
  SIZE_2,
  SPACING_AUTO,
  SPACING_1,
  SPACING_2,
  ALIGN_CENTER,
} from '@opentrons/components'

import type { StyleProps } from '@opentrons/components'
import { DECK_CAL_STATUS_OK } from '../../calibration'
import type { DeckCalibrationStatus } from '../../calibration/types'

export type DeckCalibrationWarningProps = {|
  ...StyleProps,
  deckCalibrationStatus: DeckCalibrationStatus | null,
|}

const CALIBRATION_REQUIRED = 'Calibration required'

export function DeckCalibrationWarning({
  deckCalibrationStatus,
  ...styleProps
}: DeckCalibrationWarningProps): React.Node {
  return (
    <>
      {deckCalibrationStatus && deckCalibrationStatus !== DECK_CAL_STATUS_OK && (
        <Flex alignItems={ALIGN_CENTER} color={COLOR_ERROR} {...styleProps}>
          <Box size={SIZE_2} paddingY={SPACING_1} paddingRight={SPACING_2}>
            <Icon name="alert-circle" />
          </Box>
          <Box
            fontSize={FONT_SIZE_BODY_1}
            paddingRight={SPACING_1}
            marginRight={SPACING_AUTO}
          >
            <Text>{CALIBRATION_REQUIRED}</Text>
          </Box>
        </Flex>
      )}
    </>
  )
}
