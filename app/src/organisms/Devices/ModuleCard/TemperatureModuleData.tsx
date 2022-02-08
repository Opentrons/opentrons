import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  C_BLUE,
  C_DARK_BLACK,
  C_DARK_GRAY,
  C_SILVER_GRAY,
  C_SKY_BLUE,
  DIRECTION_COLUMN,
  Flex,
  FONT_SIZE_CAPTION,
  Text,
  SPACING,
} from '@opentrons/components'
import { StatusLabel } from '../../../atoms/StatusLabel'
import type { TemperatureStatus } from '../../../redux/modules/api-types'

interface TemperatureModuleProps {
  moduleStatus: TemperatureStatus
  targetTemp: number | null
  currentTemp: number
}

export const TemperatureModuleData = (
  props: TemperatureModuleProps
): JSX.Element | null => {
  const { moduleStatus, targetTemp, currentTemp } = props
  const { t } = useTranslation('device_details')

  let backgroundColor: string = C_SILVER_GRAY
  let iconColor: string = C_DARK_GRAY
  let textColor
  let pulse
  switch (moduleStatus) {
    case 'idle': {
      backgroundColor = C_SILVER_GRAY
      iconColor = C_DARK_GRAY
      textColor = C_DARK_BLACK
      break
    }
    case 'holding at target': {
      backgroundColor = C_SKY_BLUE
      iconColor = C_BLUE
      break
    }
    case 'cooling':
    case 'heating': {
      backgroundColor = C_SKY_BLUE
      pulse = true
      break
    }
  }

  return (
    <>
      <StatusLabel
        status={moduleStatus}
        backgroundColor={backgroundColor}
        iconColor={iconColor}
        textColor={textColor}
        pulse={pulse}
      />
      <Flex fontSize={FONT_SIZE_CAPTION} flexDirection={DIRECTION_COLUMN}>
        <Text marginBottom={SPACING.spacing1}>
          {t(targetTemp === null ? 'na_temp' : 'target_temp', {
            temp: targetTemp,
          })}
        </Text>
        <Text>{t('current_temp', { temp: currentTemp })}</Text>
      </Flex>
    </>
  )
}
