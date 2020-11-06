// @flow

import * as React from 'react'

import {
  ALIGN_CENTER,
  Box,
  Flex,
  BORDER_SOLID_LIGHT,
  COLOR_ERROR,
  DIRECTION_COLUMN,
  FONT_SIZE_BODY_1,
  FONT_WEIGHT_SEMIBOLD,
  Icon,
  SIZE_2,
  SPACING_3,
  SPACING_2,
  SPACING_1,
  Text,
  TEXT_TRANSFORM_CAPITALIZE,
} from '@opentrons/components'

import type { StyleProps } from '@opentrons/components'

const WARNING_HEADER = 'robot calibration required'
const WARNING_TEXT = 'This OT-2 does not have a valid deck calibration.'

type Props = {|
  ...StyleProps,
|}
export function CalibrationCardWarning({ ...styleProps }: Props): React.Node {
  return (
    <Box
      borderBottom={BORDER_SOLID_LIGHT}
      padding="0.5rem 1rem 1rem"
      color={COLOR_ERROR}
      {...styleProps}
    >
      <Flex flexDirection={DIRECTION_COLUMN} fontSize={FONT_SIZE_BODY_1}>
        <Flex alignItems={ALIGN_CENTER}>
          <Box paddingY={SPACING_1} paddingRight={SPACING_2} size={SIZE_2}>
            <Icon name="alert-circle" />
          </Box>
          <Text
            as="h4"
            fontWeight={FONT_WEIGHT_SEMIBOLD}
            textTransform={TEXT_TRANSFORM_CAPITALIZE}
          >
            {WARNING_HEADER}
          </Text>
        </Flex>
        <Flex>
          <Box minWidth={SIZE_2} />
          <Text>{WARNING_TEXT}</Text>
        </Flex>
      </Flex>
    </Box>
  )
}
