import { useTranslation } from 'react-i18next'
import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { StatusLabel } from '/app/atoms/StatusLabel'
import type { TemperatureStatus } from '/app/redux/modules/api-types'

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

  let backgroundColor: string = COLORS.grey30
  let iconColor: string = COLORS.grey60
  let textColor
  let pulse
  switch (moduleStatus) {
    case 'idle': {
      textColor = COLORS.grey60
      break
    }
    case 'holding at target': {
      backgroundColor = COLORS.blue30
      iconColor = COLORS.blue60
      textColor = COLORS.blue60
      break
    }
    case 'cooling':
    case 'heating': {
      backgroundColor = COLORS.blue30
      iconColor = COLORS.blue60
      textColor = COLORS.blue60
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
        data-testid="temp_module_data"
      >
        <LegacyStyledText marginBottom={SPACING.spacing2}>
          {t(targetTemp == null ? 'na_temp' : 'target_temp', {
            temp: targetTemp,
          })}
        </LegacyStyledText>
        <LegacyStyledText>
          {t('current_temp', { temp: currentTemp })}
        </LegacyStyledText>
      </Flex>
    </>
  )
}
