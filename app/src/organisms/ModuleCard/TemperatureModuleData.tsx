import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  COLORS,
  TYPOGRAPHY,
} from '@opentrons/components'
import { StatusLabel } from '../../atoms/StatusLabel'
import { StyledText } from '../../atoms/text'
import type { TemperatureStatus } from '../../redux/modules/api-types'

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

  let backgroundColor: string = COLORS.medGrey
  let iconColor: string = COLORS.darkGrey
  let textColor
  let pulse
  switch (moduleStatus) {
    case 'idle': {
      backgroundColor = COLORS.medGrey
      iconColor = COLORS.darkGrey
      textColor = COLORS.darkBlack
      break
    }
    case 'holding at target': {
      backgroundColor = COLORS.medBlue
      iconColor = COLORS.blue
      break
    }
    case 'cooling':
    case 'heating': {
      backgroundColor = COLORS.medBlue
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
      <Flex
        fontSize={TYPOGRAPHY.fontSizeCaption}
        flexDirection={DIRECTION_COLUMN}
        data-testid={`temp_module_data`}
      >
        <StyledText marginBottom={SPACING.spacing1}>
          {t(targetTemp == null ? 'na_temp' : 'target_temp', {
            temp: targetTemp,
          })}
        </StyledText>
        <StyledText>{t('current_temp', { temp: currentTemp })}</StyledText>
      </Flex>
    </>
  )
}
