import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StatusLabel } from '../../atoms/StatusLabel'
import {
  Flex,
  Text,
  TYPOGRAPHY,
  SPACING_2,
  FONT_WEIGHT_REGULAR,
  DIRECTION_COLUMN,
  COLORS,
  SPACING,
  WRAP,
} from '@opentrons/components'

import type { ThermocyclerStatus } from '../../redux/modules/api-types'

interface ThermocyclerModuleProps {
  status: ThermocyclerStatus
  currentTemp: number | null
  targetTemp: number | null
  lidTemp: number | null
  lidTarget: number | null
}

export const ThermocyclerModuleData = (
  props: ThermocyclerModuleProps
): JSX.Element | null => {
  const { status, currentTemp, targetTemp, lidTemp, lidTarget } = props
  const { t } = useTranslation('device_details')

  const getStatusLabelProps = (
    status: string | null
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
      case 'cooling':
      case 'heating': {
        StatusLabelProps.backgroundColor = COLORS.medBlue
        StatusLabelProps.pulse = true
        break
      }
      case 'error': {
        StatusLabelProps.backgroundColor = COLORS.warningBackground
        StatusLabelProps.iconColor = COLORS.warningEnabled
        StatusLabelProps.textColor = COLORS.warningText
      }
    }
    return StatusLabelProps
  }

  return (
    <Flex flexWrap={WRAP} gridGap={`${SPACING.spacing1} ${SPACING.spacing6}`}>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        data-testid="thermocycler_module_data_lid"
        gridColumn="1/4"
      >
        <Text
          textTransform={TYPOGRAPHY.textTransformUppercase}
          color={COLORS.darkGreyEnabled}
          fontWeight={FONT_WEIGHT_REGULAR}
          fontSize={TYPOGRAPHY.fontSizeCaption}
          marginTop={SPACING_2}
          marginBottom={SPACING.spacing2}
        >
          {t('tc_lid')}
        </Text>
        <Text
          title="lid_target_temp"
          fontSize={TYPOGRAPHY.fontSizeCaption}
          marginBottom={SPACING.spacing1}
        >
          {t(lidTarget == null ? 'na_temp' : 'target_temp', {
            temp: lidTarget,
          })}
        </Text>
        <Text title="lid_temp" fontSize={TYPOGRAPHY.fontSizeCaption}>
          {t('current_temp', { temp: lidTemp })}
        </Text>
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        data-testid="thermocycler_module_data_block"
        gridColumn="5/8"
      >
        <Text
          textTransform={TYPOGRAPHY.textTransformUppercase}
          color={COLORS.darkGreyEnabled}
          fontWeight={FONT_WEIGHT_REGULAR}
          fontSize={TYPOGRAPHY.fontSizeCaption}
          marginTop={SPACING_2}
        >
          {t('tc_block')}
        </Text>
        <StatusLabel status={status} {...getStatusLabelProps(status)} />
        <Text
          title="tc_target_temp"
          fontSize={TYPOGRAPHY.fontSizeCaption}
          marginBottom={SPACING.spacing1}
        >
          {t(targetTemp == null ? 'na_temp' : 'target_temp', {
            temp: targetTemp,
          })}
        </Text>
        <Text title="tc_current_temp" fontSize={TYPOGRAPHY.fontSizeCaption}>
          {t('current_temp', { temp: currentTemp })}
        </Text>
      </Flex>
    </Flex>
  )
}
