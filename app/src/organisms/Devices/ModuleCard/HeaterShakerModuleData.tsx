import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  Text,
  JUSTIFY_SPACE_BETWEEN,
  TEXT_TRANSFORM_UPPERCASE,
  COLORS,
  DIRECTION_COLUMN,
  SPACING,
  ALIGN_FLEX_START,
  Icon,
  DIRECTION_ROW,
  TYPOGRAPHY,
} from '@opentrons/components'
import { StatusLabel } from '../../../atoms/StatusLabel'

interface HeaterShakerModuleDataProps {
  heaterStatus: string
  shakerStatus: string
  latchStatus: string
  targetTemp: number
  currentTemp: number
  targetSpeed: number
  currentSpeed: number
  showTemperatureData?: boolean
}

export const HeaterShakerModuleData = (
  props: HeaterShakerModuleDataProps
): JSX.Element | null => {
  const {
    heaterStatus,
    shakerStatus,
    latchStatus,
    targetTemp,
    currentTemp,
    targetSpeed,
    currentSpeed,
    showTemperatureData,
  } = props
  const { t } = useTranslation('device_details')

  const getStatusLabelProps = (
    status: string | null
  ): { backgroundColor: string; iconColor: string; textColor: string } => {
    const StatusLabelProps = {
      backgroundColor: COLORS.medGrey,
      iconColor: COLORS.darkGrey,
      textColor: COLORS.bluePressed,
      pulse: false,
    }

    switch (status) {
      case 'idle': {
        StatusLabelProps.backgroundColor = COLORS.medGrey
        StatusLabelProps.iconColor = COLORS.darkGrey
        StatusLabelProps.textColor = COLORS.darkBlack
        break
      }
      case 'heating':
      case 'shaking': {
        StatusLabelProps.backgroundColor = COLORS.blue + '1A'
        StatusLabelProps.pulse = true
        break
      }
    }
    return StatusLabelProps
  }

  return (
    <>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
        {showTemperatureData && (
          <Flex flexDirection={DIRECTION_COLUMN} marginRight={SPACING.spacing6}>
            <Text
              textTransform={TEXT_TRANSFORM_UPPERCASE}
              color={COLORS.darkGreyEnabled}
              fontWeight={TYPOGRAPHY.fontWeightRegular}
              fontSize={TYPOGRAPHY.fontSizeH6}
              marginTop={SPACING.spacing3}
            >
              {t('heater')}
            </Text>
            <StatusLabel
              status={heaterStatus}
              {...getStatusLabelProps(heaterStatus)}
            />
            <Text
              title="heater_target_temp"
              fontSize={TYPOGRAPHY.fontSizeH6}
              marginBottom={SPACING.spacing1}
            >
              {t(targetTemp === null ? 'na_temp' : 'target_temp', {
                temp: targetTemp,
              })}
            </Text>
            <Text title="heater_temp" fontSize={TYPOGRAPHY.fontSizeH6}>
              {t('current_temp', { temp: currentTemp })}
            </Text>
          </Flex>
        )}
        <Flex flexDirection={DIRECTION_COLUMN}>
          <Text
            textTransform={TEXT_TRANSFORM_UPPERCASE}
            color={COLORS.darkGreyEnabled}
            fontWeight={TYPOGRAPHY.fontWeightRegular}
            fontSize={TYPOGRAPHY.fontSizeH6}
            marginTop={SPACING.spacing3}
          >
            {t('shaker')}
          </Text>
          <StatusLabel
            status={shakerStatus}
            {...getStatusLabelProps(shakerStatus)}
          />
          <Text
            title="shaker_target_speed"
            fontSize={TYPOGRAPHY.fontSizeH6}
            marginBottom={SPACING.spacing1}
          >
            {t(targetSpeed === null ? 'na_speed' : 'target_speed', {
              speed: targetSpeed,
            })}
          </Text>
          <Text title="shaker_current_speed" fontSize={TYPOGRAPHY.fontSizeH6}>
            {t('current_speed', { speed: currentSpeed })}
          </Text>
        </Flex>
      </Flex>
      <Flex flexDirection={DIRECTION_ROW}>
        <Flex flexDirection={DIRECTION_COLUMN}>
          <Text
            textTransform={TEXT_TRANSFORM_UPPERCASE}
            color={COLORS.darkGreyEnabled}
            fontWeight={TYPOGRAPHY.fontWeightRegular}
            fontSize={TYPOGRAPHY.fontSizeH6}
            marginTop={SPACING.spacing3}
          >
            {'Labware Latch'}
          </Text>
          <Text
            title="latch_status"
            fontSize={TYPOGRAPHY.fontSizeH6}
            alignItems={ALIGN_FLEX_START}
          >
            <Flex flexDirection={DIRECTION_ROW}>
              {/* {TODO(sh, 2022-02-22): Conditionally render icon based on latch status} */}
              <Icon name="closed-locked" size={'1rem'} />
              {latchStatus}
            </Flex>
          </Text>
        </Flex>
      </Flex>
    </>
  )
}
