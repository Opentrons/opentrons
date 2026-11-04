import { useTranslation } from 'react-i18next'

import { Chip, Flex, StyledText } from '@opentrons/components'

import { MODULE_INFO_DETAIL_CONTAINER_STYLE } from './constants'

import type { TemperatureStatus } from '@opentrons/api-client'

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

  const chipType = moduleStatus === 'idle' ? 'neutral' : 'info'
  const shouldPulse = moduleStatus === 'cooling' || moduleStatus === 'heating'

  return (
    <Flex
      css={MODULE_INFO_DETAIL_CONTAINER_STYLE}
      data-testid="temp_module_data"
    >
      <Chip
        text={moduleStatus}
        chipSize="small"
        type={chipType}
        hasIcon={true}
        pulseIcon={shouldPulse}
        iconName="connection-status"
        textTransform="capitalize"
      />
      <StyledText forwardedAs="h3">
        {t(targetTemp == null ? 'na_temp' : 'target_temp', {
          temp: targetTemp,
        })}
      </StyledText>
      <StyledText forwardedAs="h3">
        {t('current_temp', { temp: currentTemp })}
      </StyledText>
    </Flex>
  )
}
