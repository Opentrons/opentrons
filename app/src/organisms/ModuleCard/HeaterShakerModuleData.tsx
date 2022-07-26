import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  Text,
  COLORS,
  DIRECTION_COLUMN,
  SPACING,
  Icon,
  DIRECTION_ROW,
  TYPOGRAPHY,
  SIZE_1,
  WRAP,
} from '@opentrons/components'
import { StatusLabel } from '../../atoms/StatusLabel'
import type {
  LatchStatus,
  SpeedStatus,
  TemperatureStatus,
} from '../../redux/modules/api-types'
import type { HeaterShakerModule } from '../../redux/modules/types'

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

  const getStatusLabelProps = (
    status: SpeedStatus | TemperatureStatus
  ): { backgroundColor: string; iconColor: string; textColor: string } => {
    const StatusLabelProps = {
      backgroundColor: COLORS.medGreyEnabled,
      iconColor: COLORS.darkGreyEnabled,
      textColor: COLORS.bluePressed,
      pulse: false,
    }

    switch (status) {
      case 'idle': {
        StatusLabelProps.backgroundColor = COLORS.medGreyEnabled
        StatusLabelProps.iconColor = COLORS.darkGreyEnabled
        StatusLabelProps.textColor = COLORS.darkBlackEnabled
        break
      }
      case 'holding at target': {
        StatusLabelProps.backgroundColor = COLORS.medBlue
        StatusLabelProps.iconColor = COLORS.blueEnabled
        break
      }
      case 'error': {
        StatusLabelProps.backgroundColor = COLORS.warningBackground
        StatusLabelProps.iconColor = COLORS.warningEnabled
        StatusLabelProps.textColor = COLORS.warningText
        break
      }
      case 'heating':
      case 'cooling':
      case 'slowing down':
      case 'speeding up': {
        StatusLabelProps.backgroundColor = COLORS.blueEnabled + '1A'
        StatusLabelProps.pulse = true
        break
      }
    }

    return StatusLabelProps
  }

  const getLatchStatus = (latchStatus: LatchStatus): JSX.Element | string => {
    switch (latchStatus) {
      case 'opening':
      case 'idle_open':
      case 'idle_unknown': {
        return (
          <Text textTransform={TYPOGRAPHY.textTransformCapitalize}>
            {t('open', { ns: 'shared' })}
          </Text>
        )
      }
      case 'closing':
      case 'idle_closed': {
        if (isShaking) {
          return (
            <Text textTransform={TYPOGRAPHY.textTransformCapitalize}>
              {t('closed_and_locked', { ns: 'heater_shaker' })}
            </Text>
          )
        } else {
          return (
            <Text textTransform={TYPOGRAPHY.textTransformCapitalize}>
              {t('closed', { ns: 'heater_shaker' })}
            </Text>
          )
        }
      }
      default:
        return latchStatus
    }
  }

  return (
    <Flex flexWrap={WRAP} gridGap={`${SPACING.spacing1} ${SPACING.spacing6}`}>
      {showTemperatureData && (
        <Flex
          flexDirection={DIRECTION_COLUMN}
          data-testid={`heater_shaker_module_data_temp`}
        >
          <Text
            textTransform={TYPOGRAPHY.textTransformUppercase}
            color={COLORS.darkGreyEnabled}
            fontWeight={TYPOGRAPHY.fontWeightRegular}
            fontSize={TYPOGRAPHY.fontSizeH6}
            marginTop={SPACING.spacing3}
          >
            {t('heater')}
          </Text>
          <StatusLabel
            status={moduleData.temperatureStatus}
            {...getStatusLabelProps(moduleData.temperatureStatus)}
          />
          <Text
            title="heater_target_temp"
            fontSize={TYPOGRAPHY.fontSizeH6}
            marginBottom={SPACING.spacing1}
          >
            {t(
              moduleData.targetTemperature != null ? 'target_temp' : 'na_temp',
              {
                temp: moduleData.targetTemperature,
              }
            )}
          </Text>
          <Text title="heater_temp" fontSize={TYPOGRAPHY.fontSizeH6}>
            {t('current_temp', { temp: moduleData.currentTemperature })}
          </Text>
        </Flex>
      )}
      <Flex
        flexDirection={DIRECTION_COLUMN}
        data-testid={`heater_shaker_module_data_shaker`}
      >
        <Text
          textTransform={TYPOGRAPHY.textTransformUppercase}
          color={COLORS.darkGreyEnabled}
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          fontSize={TYPOGRAPHY.fontSizeH6}
          marginTop={SPACING.spacing3}
        >
          {t('shaker')}
        </Text>
        <StatusLabel
          status={moduleData.speedStatus}
          {...getStatusLabelProps(moduleData.speedStatus)}
        />

        <Text
          title="shaker_target_speed"
          fontSize={TYPOGRAPHY.fontSizeH6}
          marginBottom={SPACING.spacing1}
        >
          {t(moduleData.targetSpeed != null ? 'target_speed' : 'na_speed', {
            speed: moduleData.targetSpeed,
          })}
        </Text>
        <Text title="shaker_current_speed" fontSize={TYPOGRAPHY.fontSizeH6}>
          {t('current_speed', { speed: moduleData.currentSpeed })}
        </Text>
      </Flex>

      <Flex
        flexDirection={DIRECTION_ROW}
        data-testid={`heater_shaker_module_data_latch`}
      >
        <Flex flexDirection={DIRECTION_COLUMN}>
          <Text
            textTransform={TYPOGRAPHY.textTransformUppercase}
            color={COLORS.darkGreyEnabled}
            fontWeight={TYPOGRAPHY.fontWeightRegular}
            fontSize={TYPOGRAPHY.fontSizeH6}
            marginTop={SPACING.spacing3}
            title="latch_status"
          >
            {t('labware_latch', { ns: 'heater_shaker' })}
          </Text>
          <Flex
            flexDirection={DIRECTION_ROW}
            marginTop={SPACING.spacing2}
            fontWeight={TYPOGRAPHY.fontWeightRegular}
            fontSize={TYPOGRAPHY.fontSizeH6}
          >
            {isShaking && (
              <Icon
                paddingBottom="3px"
                paddingRight={SPACING.spacing2}
                name="closed-locked"
                data-testid="HeaterShakerModuleData_latch_lock"
                size={SIZE_1}
              />
            )}
            {getLatchStatus(moduleData.labwareLatchStatus)}
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
