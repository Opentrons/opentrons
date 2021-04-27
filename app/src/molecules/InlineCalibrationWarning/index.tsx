import * as React from 'react'
import {
  Icon,
  Box,
  Flex,
  Text,
  FONT_WEIGHT_SEMIBOLD,
  FONT_SIZE_BODY_1,
  COLOR_ERROR,
  COLOR_WARNING,
  SIZE_2,
  SPACING_AUTO,
  SPACING_1,
  SPACING_2,
  ALIGN_CENTER,
} from '@opentrons/components'
import type { StyleProps } from '@opentrons/components'

export const REQUIRED: 'required' = 'required'
export const RECOMMENDED: 'recommended' = 'recommended'
export type WarningType = typeof REQUIRED | typeof RECOMMENDED

const CALIBRATION_REQUIRED = 'Calibration required'
const CALIBRATION_RECOMMENDED = 'Recalibration recommended'

const CONTENT_MAP = {
  [REQUIRED]: {
    color: COLOR_ERROR,
    content: CALIBRATION_REQUIRED,
  },
  [RECOMMENDED]: {
    color: COLOR_WARNING,
    content: CALIBRATION_RECOMMENDED,
  },
}

export interface InlineCalibrationWarningProps extends StyleProps {
  warningType: WarningType | null
}

export function InlineCalibrationWarning(
  props: InlineCalibrationWarningProps
): JSX.Element {
  const { warningType, marginTop = SPACING_2, ...styleProps } = props
  return (
    <>
      {warningType && (
        <Flex
          alignItems={ALIGN_CENTER}
          color={CONTENT_MAP[warningType].color}
          marginTop={marginTop}
          {...styleProps}
        >
          <Box size={SIZE_2} paddingY={SPACING_1} paddingRight={SPACING_2}>
            <Icon name="alert-circle" />
          </Box>
          <Box
            fontSize={FONT_SIZE_BODY_1}
            paddingRight={SPACING_1}
            marginRight={SPACING_AUTO}
            fontWeight={FONT_WEIGHT_SEMIBOLD}
          >
            <Text>{CONTENT_MAP[warningType].content}</Text>
          </Box>
        </Flex>
      )}
    </>
  )
}
