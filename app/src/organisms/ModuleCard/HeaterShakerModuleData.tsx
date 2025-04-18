import { useTranslation } from 'react-i18next'
import {
  COLORS,
  DIRECTION_ROW,
  Flex,
  Icon,
  SIZE_1,
  SPACING,
  StyledText,
  TYPOGRAPHY,
  Chip,
  ChipType
} from '@opentrons/components'
import type {
  LatchStatus,
  SpeedStatus,
  TemperatureStatus,
} from '/app/redux/modules/api-types'
import type { HeaterShakerModule } from '/app/redux/modules/types'

import {
  MODULE_INFO_SUB_CONTAINTER_STYLE,
  MODULE_INFO_HEADER_TEXT_STYLE,
  MODULE_INFO_DETAIL_TEXT_STYLE,
} from './constants'

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
        return "neutral"

      case 'holding at target':
      case 'heating':
      case 'cooling':
      case 'slowing down':
      case 'speeding up':
        return "info"

      default:
        return "warning"
    }
  }

  const getLatchStatus = (latchStatus: LatchStatus): JSX.Element | string => {
    switch (latchStatus) {
      case 'opening':
      case 'idle_open':
      case 'idle_unknown': {
        return (
          <StyledText textTransform={TYPOGRAPHY.textTransformCapitalize}>
            {t('open', { ns: 'shared' })}
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
    <>
      {showTemperatureData && (
        <Flex
          css={MODULE_INFO_SUB_CONTAINTER_STYLE}
          data-testid="heater_shaker_module_data_temp"
        >
          <StyledText css={MODULE_INFO_HEADER_TEXT_STYLE}>
            {t('heater')}
          </StyledText>
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
          <Flex css={MODULE_INFO_SUB_CONTAINTER_STYLE}>
            <StyledText
              title="heater_target_temp"
              css={MODULE_INFO_DETAIL_TEXT_STYLE}
            >
              {t(
                moduleData.targetTemperature != null
                  ? 'target_temp'
                  : 'na_temp',
                {
                  temp: moduleData.targetTemperature,
                }
              )}
            </StyledText>
            <StyledText title="heater_temp" css={MODULE_INFO_DETAIL_TEXT_STYLE}>
              {t('current_temp', { temp: moduleData.currentTemperature })}
            </StyledText>
          </Flex>
        </Flex>
      )}
      <Flex
        css={MODULE_INFO_SUB_CONTAINTER_STYLE}
        data-testid="heater_shaker_module_data_shaker"
      >
        <StyledText css={MODULE_INFO_HEADER_TEXT_STYLE}>
          {t('shaker')}
        </StyledText>
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
        <StyledText
          title="shaker_target_speed"
          css={MODULE_INFO_DETAIL_TEXT_STYLE}
        >
          {t(moduleData.targetSpeed != null ? 'target_speed' : 'na_speed', {
            speed: moduleData.targetSpeed,
          })}
        </StyledText>
        <StyledText
          title="shaker_current_speed"
          css={MODULE_INFO_DETAIL_TEXT_STYLE}
        >
          {t('current_speed', { speed: moduleData.currentSpeed })}
        </StyledText>
      </Flex>
      <Flex
        css={MODULE_INFO_SUB_CONTAINTER_STYLE}
        data-testid="heater_shaker_module_data_latch"
      >
        <StyledText css={MODULE_INFO_HEADER_TEXT_STYLE} title="latch_status">
          {t('labware_latch', { ns: 'heater_shaker' })}
        </StyledText>
        <Flex
          css={MODULE_INFO_SUB_CONTAINTER_STYLE}
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
          <StyledText css={MODULE_INFO_DETAIL_TEXT_STYLE}>
            {getLatchStatus(moduleData.labwareLatchStatus)}
          </StyledText>
        </Flex>
      </Flex>
    </>
  )
}
