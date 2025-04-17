import { useTranslation } from 'react-i18next'
import {
  COLORS,
  Flex,
  StyledText,
} from '@opentrons/components'
import { StatusLabel } from '/app/atoms/StatusLabel'
import type { TemperatureStatus } from '/app/redux/modules/api-types'
import {
  MODULE_INFO_SUB_CONTAINTER_STYLE,
  MODULE_INFO_DETAIL_TEXT_STYLE,
} from './constants'

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
    <Flex css={MODULE_INFO_SUB_CONTAINTER_STYLE} data-testid="temp_module_data">
      <StatusLabel
        status={moduleStatus}
        backgroundColor={backgroundColor}
        iconColor={iconColor}
        textColor={textColor}
        pulse={pulse}
      />
      <StyledText css={MODULE_INFO_DETAIL_TEXT_STYLE}>
        {t(targetTemp == null ? 'na_temp' : 'target_temp', {
          temp: targetTemp,
        })}
      </StyledText>
      <StyledText css={MODULE_INFO_DETAIL_TEXT_STYLE}>
        {t('current_temp', { temp: currentTemp })}
      </StyledText>
    </Flex>
  )
}
