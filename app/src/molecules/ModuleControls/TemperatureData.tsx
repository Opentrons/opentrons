import * as React from 'react'
import {
  DIRECTION_COLUMN,
  Flex,
  Icon,
  SPACING_1,
  SPACING_3,
  Text,
  FONT_SIZE_BODY_1,
  FONT_WEIGHT_SEMIBOLD,
  COLOR_SUCCESS,
  COLOR_WARNING_LIGHT,
  COLOR_ERROR,
  C_BLUE,
  TEXT_TRANSFORM_CAPITALIZE,
  TEXT_TRANSFORM_UPPERCASE,
} from '@opentrons/components'

import type {
  TemperatureStatus,
  ThermocyclerStatus,
} from '../../redux/modules/types'

interface TemperatureDataProps {
  title: string | null
  current: number | null
  target: number | null
  status?: TemperatureStatus | ThermocyclerStatus | null
}

export const TemperatureData = ({
  title,
  status,
  current,
  target,
}: TemperatureDataProps): JSX.Element => (
  <Flex flexDirection={DIRECTION_COLUMN} fontSize={FONT_SIZE_BODY_1}>
    {title && (
      <Text
        textTransform={TEXT_TRANSFORM_UPPERCASE}
        marginBottom={SPACING_1}
        fontWeight={FONT_WEIGHT_SEMIBOLD}
      >
        {title}
      </Text>
    )}
    {status && (
      <Flex marginBottom={SPACING_1}>
        <Icon
          name="circle"
          width="10px"
          marginRight="0.375rem"
          color={
            status.includes('heat')
              ? COLOR_ERROR
              : status.includes('cool')
              ? C_BLUE
              : status.includes('idle')
              ? COLOR_WARNING_LIGHT
              : COLOR_SUCCESS
          }
        />
        <Text textTransform={TEXT_TRANSFORM_CAPITALIZE}>{status}</Text>
      </Flex>
    )}
    <Text marginBottom={SPACING_1}>{`Current: ${
      current != null ? current + ' °C' : 'n/a'
    }`}</Text>
    <Text marginBottom={SPACING_3}>{`Target: ${
      target != null ? target + ' °C' : 'n/a'
    }`}</Text>
  </Flex>
)
