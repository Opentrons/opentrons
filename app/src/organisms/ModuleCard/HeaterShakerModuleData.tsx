import { useTranslation } from 'react-i18next'

import {
  Chip,
  COLORS,
  DIRECTION_ROW,
  Flex,
  Icon,
  SIZE_1,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import {
  MODULE_INFO_CONTAINER_STYLE,
  MODULE_INFO_DETAIL_CONTAINER_STYLE,
  MODULE_INFO_SUB_CONTAINER_STYLE,
} from './constants'

import type {
  HeaterShakerModule,
  LatchStatus,
  SpeedStatus,
  TemperatureStatus,
} from '@opentrons/api-client'
import type { ChipType } from '@opentrons/components'

interface HeaterShakerModuleDataProps {
  moduleData: HeaterShakerModule['data']
  showTemperatureData?: boolean
}

export const HeaterShakerModuleData = (
  props: HeaterShakerModuleDataProps
): JSX.Element | null => {
  const { moduleData, showTemperatureData } = props
  const { t } = useTranslation(['device_details', 'heater_shaker', 'shared'])
  const isShaking = moduleData.speedStatus !== 'idle'

  const getStatusChipType = (
    status: SpeedStatus | TemperatureStatus
  ): ChipType => {
    switch (status) {
      case 'idle':
        return 'neutral'

      case 'holding at target':
      case 'heating':
      case 'cooling':
      case 'slowing down':
      case 'speeding up':
        return 'info'

      default:
        return 'warning'
    }
  }

  const getLatchStatus = (latchStatus: LatchStatus): JSX.Element | string => {
    switch (latchStatus) {
      case 'opening':
      case 'idle_open':
      case 'idle_unknown': {
        return (
          <StyledText textTransform={TYPOGRAPHY.textTransformCapitalize}>
            {t('open', { ns: 'heater_shaker' })}
          </StyledText>
        )
      }
      case 'closing':
      case 'idle_closed': {
        if (isShaking) {
          return (
            <StyledText textTransform={TYPOGRAPHY.textTransformCapitalize}>
              {t('closed_and_locked', { ns: 'heater_shaker' })}
            </StyledText>
          )
        } else {
          return (
            <StyledText textTransform={TYPOGRAPHY.textTransformCapitalize}>
              {t('closed', { ns: 'heater_shaker' })}
            </StyledText>
          )
        }
      }
      default:
        return latchStatus
    }
  }

  return (
    <Flex css={MODULE_INFO_CONTAINER_STYLE}>
      {(showTemperatureData ?? false) && (
        <Flex
          css={MODULE_INFO_SUB_CONTAINER_STYLE}
          data-testid="heater_shaker_module_data_temp"
        >
          <StyledText forwardedAs="h3" color={COLORS.grey60}>
            {t('heater')}
          </StyledText>
          <Flex css={MODULE_INFO_DETAIL_CONTAINER_STYLE}>
            <Chip
              text={moduleData.temperatureStatus}
              chipSize="small"
              type={getStatusChipType(moduleData.temperatureStatus)}
              hasIcon={true}
              pulseIcon={
                moduleData.temperatureStatus === 'cooling' ||
                moduleData.temperatureStatus === 'heating'
              }
              iconName="connection-status"
              textTransform="capitalize"
              data-testid="tempStatus"
            />
            <StyledText forwardedAs="h3" title="heater_target_temp">
              {t(
                moduleData.targetTemperature != null
                  ? 'target_temp'
                  : 'na_temp',
                {
                  temp: moduleData.targetTemperature,
                }
              )}
            </StyledText>
            <StyledText forwardedAs="h3" title="heater_temp">
              {t('current_temp', { temp: moduleData.currentTemperature })}
            </StyledText>
          </Flex>
        </Flex>
      )}
      <Flex
        css={MODULE_INFO_SUB_CONTAINER_STYLE}
        data-testid="heater_shaker_module_data_shaker"
      >
        <StyledText forwardedAs="h3" color={COLORS.grey60}>
          {t('shaker')}
        </StyledText>
        <Flex css={MODULE_INFO_DETAIL_CONTAINER_STYLE}>
          <Chip
            text={moduleData.speedStatus}
            chipSize="small"
            type={getStatusChipType(moduleData.speedStatus)}
            hasIcon={true}
            pulseIcon={
              moduleData.speedStatus === 'speeding up' ||
              moduleData.speedStatus === 'slowing down'
            }
            iconName="connection-status"
            textTransform="capitalize"
            data-testid="shakerStatus"
          />
          <StyledText forwardedAs="h3" title="shaker_target_speed">
            {t(moduleData.targetSpeed != null ? 'target_speed' : 'na_speed', {
              speed: moduleData.targetSpeed,
            })}
          </StyledText>
          <StyledText forwardedAs="h3" title="shaker_current_speed">
            {t('current_speed', { speed: moduleData.currentSpeed ?? 0 })}
          </StyledText>
        </Flex>
      </Flex>
      <Flex
        css={MODULE_INFO_SUB_CONTAINER_STYLE}
        data-testid="heater_shaker_module_data_latch"
      >
        <StyledText forwardedAs="h3" color={COLORS.grey60} title="latch_status">
          {t('labware_latch', { ns: 'heater_shaker' })}
        </StyledText>
        <Flex
          css={MODULE_INFO_DETAIL_CONTAINER_STYLE}
          flexDirection={DIRECTION_ROW}
        >
          {isShaking && (
            <Icon
              paddingBottom="3px"
              paddingRight={SPACING.spacing4}
              name="closed-locked"
              data-testid="HeaterShakerModuleData_latch_lock"
              size={SIZE_1}
            />
          )}
          <StyledText forwardedAs="h3">
            {getLatchStatus(moduleData.labwareLatchStatus)}
          </StyledText>
        </Flex>
      </Flex>
    </Flex>
  )
}
