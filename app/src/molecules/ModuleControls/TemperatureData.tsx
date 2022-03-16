import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  DIRECTION_COLUMN,
  Flex,
  Icon,
  SPACING_1,
  SPACING_3,
  Text,
  FONT_SIZE_BODY_1,
  FONT_WEIGHT_SEMIBOLD,
  C_LIGHT_GRAY,
  OVERLAY_LIGHT_GRAY_50,
  COLOR_SUCCESS,
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
  status?: TemperatureStatus | ThermocyclerStatus | null | undefined
}

export const TemperatureData = ({
  title,
  status,
  current,
  target,
}: TemperatureDataProps): JSX.Element => {
  const { t } = useTranslation('run_details')
  const getStatusColor = (): string => {
    if (status === 'heating') {
      return COLOR_ERROR
    } else if (status === 'cooling') {
      return C_BLUE
    } else if (status === 'error') {
      return COLOR_ERROR
    } else if (status === 'idle') {
      return C_LIGHT_GRAY
    } else {
      return COLOR_SUCCESS
    }
  }
  return (
    <Flex flexDirection={DIRECTION_COLUMN} fontSize={FONT_SIZE_BODY_1}>
      {title && (
        <Text
          textTransform={TEXT_TRANSFORM_UPPERCASE}
          marginBottom={SPACING_1}
          fontWeight={FONT_WEIGHT_SEMIBOLD}
          backgroundColor={OVERLAY_LIGHT_GRAY_50}
        >
          {title}
        </Text>
      )}
      {status && (
        <Flex marginBottom={SPACING_1}>
          <Icon
            name="circle"
            width="10px"
            marginRight={SPACING_1}
            color={getStatusColor()}
          />
          <Text textTransform={TEXT_TRANSFORM_CAPITALIZE}>{status}</Text>
        </Flex>
      )}
      <Text marginBottom={SPACING_1}>
        {current != null
          ? t('current_temperature', { temperature: current })
          : t('temperature_not_available', { temperature_type: 'Current' })}
      </Text>
      <Text marginBottom={SPACING_3}>
        {target != null
          ? t('target_temperature', { temperature: target })
          : t('temperature_not_available', { temperature_type: 'Target' })}
      </Text>
    </Flex>
  )
}
