import { useTranslation } from 'react-i18next'

import {
  Chip,
  DIRECTION_ROW,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'

import {
  MODULE_INFO_CONTAINER_STYLE,
  MODULE_INFO_DETAIL_CONTAINER_STYLE,
  MODULE_INFO_DETAIL_TEXT_STYLE,
  MODULE_INFO_HEADER_TEXT_STYLE,
  MODULE_INFO_SUB_CONTAINER_STYLE,
} from './constants'

import type { ChipType } from '@opentrons/components'
import type { ThermocyclerData } from '@opentrons/api-client'

interface ThermocyclerModuleProps {
  data: ThermocyclerData
}

export const ThermocyclerModuleData = (
  props: ThermocyclerModuleProps
): JSX.Element | null => {
  const { data } = props
  const { t } = useTranslation('device_details')

  const getTemperatureChipType = (status: string | null): ChipType => {
    switch (status) {
      case 'idle':
        return 'neutral'

      case 'holding at target':
      case 'cooling':
      case 'heating':
        return 'info'

      default:
        return 'warning'
    }
  }

  return (
    <Flex css={MODULE_INFO_CONTAINER_STYLE}>
      <Flex
        css={MODULE_INFO_SUB_CONTAINER_STYLE}
        data-testid="thermocycler_module_data_lid"
      >
        <StyledText css={MODULE_INFO_HEADER_TEXT_STYLE}>
          {t('tc_lid')}
        </StyledText>
        <Flex css={MODULE_INFO_DETAIL_CONTAINER_STYLE}>
          <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing4}>
            <Chip
              text={data.lidStatus === 'in_between' ? 'open' : data.lidStatus}
              chipSize="small"
              type="neutral"
              hasIcon={false}
              textTransform="capitalize"
              data-testid="lidStatus"
            />
            <Chip
              text={data.lidTemperatureStatus}
              chipSize="small"
              type={getTemperatureChipType(data.lidTemperatureStatus)}
              hasIcon={true}
              pulseIcon={
                data.lidTemperatureStatus === 'cooling' ||
                data.lidTemperatureStatus === 'heating'
              }
              iconName="connection-status"
              textTransform="capitalize"
              data-testid="lidTempStatus"
            />
          </Flex>
          <StyledText
            css={MODULE_INFO_DETAIL_TEXT_STYLE}
            title="lid_target_temp"
          >
            {t(data.lidTargetTemperature == null ? 'na_temp' : 'target_temp', {
              temp: data.lidTargetTemperature,
            })}
          </StyledText>
          <StyledText css={MODULE_INFO_DETAIL_TEXT_STYLE} title="lid_temp">
            {t('current_temp', { temp: data.lidTemperature })}
          </StyledText>
        </Flex>
      </Flex>
      <Flex
        css={MODULE_INFO_SUB_CONTAINER_STYLE}
        data-testid="thermocycler_module_data_block"
      >
        <StyledText css={MODULE_INFO_HEADER_TEXT_STYLE}>
          {t('tc_block')}
        </StyledText>
        <Flex css={MODULE_INFO_DETAIL_CONTAINER_STYLE}>
          <Chip
            text={data.status}
            chipSize="small"
            type={getTemperatureChipType(data.status)}
            hasIcon={true}
            pulseIcon={data.status === 'cooling' || data.status === 'heating'}
            iconName="connection-status"
            textTransform="capitalize"
            data-testid="blockStatus"
          />
          <StyledText
            css={MODULE_INFO_DETAIL_TEXT_STYLE}
            title="tc_target_temp"
          >
            {t(data.targetTemperature == null ? 'na_temp' : 'target_temp', {
              temp: data.targetTemperature,
            })}
          </StyledText>
          <StyledText
            css={MODULE_INFO_DETAIL_TEXT_STYLE}
            title="tc_current_temp"
          >
            {t('current_temp', { temp: data.currentTemperature })}
          </StyledText>
        </Flex>
      </Flex>
    </Flex>
  )
}
