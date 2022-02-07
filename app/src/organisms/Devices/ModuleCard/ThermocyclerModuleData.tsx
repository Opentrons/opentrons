import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StatusLabel } from '../../../atoms/StatusLabel'
import {
  Flex,
  Text,
  JUSTIFY_SPACE_BETWEEN,
  TEXT_TRANSFORM_UPPERCASE,
  SPACING_2,
  FONT_SIZE_CAPTION,
  FONT_WEIGHT_REGULAR,
  C_HARBOR_GRAY,
  C_DARK_GRAY,
  DIRECTION_COLUMN,
  SPACING_4,
  C_SILVER_GRAY,
  C_DARK_BLACK,
  C_SKY_BLUE,
  C_BLUE,
  C_BLUE_PRESSED,
} from '@opentrons/components'

import type { ThermocyclerStatus } from '../../../redux/modules/api-types'

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
      backgroundColor: C_SILVER_GRAY,
      iconColor: C_DARK_GRAY,
      textColor: C_BLUE_PRESSED,
      pulse: false,
    }

    switch (status) {
      case 'idle': {
        StatusLabelProps.backgroundColor = C_SILVER_GRAY
        StatusLabelProps.iconColor = C_DARK_GRAY
        StatusLabelProps.textColor = C_DARK_BLACK
        break
      }
      case 'holding at target': {
        StatusLabelProps.backgroundColor = C_SKY_BLUE
        StatusLabelProps.iconColor = C_BLUE
        break
      }
      case 'cooling':
      case 'heating': {
        StatusLabelProps.backgroundColor = C_SKY_BLUE
        StatusLabelProps.pulse = true
        break
      }
      case 'error': {
        StatusLabelProps.backgroundColor = '#fffcf5'
        StatusLabelProps.iconColor = '#F09D20'
        StatusLabelProps.textColor = '#7B5B09'
      }
    }
    return StatusLabelProps
  }

  return (
    <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Flex flexDirection={DIRECTION_COLUMN}>
        <Text
          textTransform={TEXT_TRANSFORM_UPPERCASE}
          color={C_HARBOR_GRAY}
          fontWeight={FONT_WEIGHT_REGULAR}
          fontSize={FONT_SIZE_CAPTION}
          marginTop={SPACING_2}
        >
          {t('tc_lid')}
        </Text>
        <Text title="lid_target_temp" fontSize={FONT_SIZE_CAPTION}>
          {t(lidTarget === null ? 'na_temp' : 'target_temp', {
            temp: lidTarget,
          })}
        </Text>
        <Text title="lid_temp" fontSize={FONT_SIZE_CAPTION}>
          {t('current_temp', { temp: lidTemp })}
        </Text>
      </Flex>
      <Flex flexDirection={DIRECTION_COLUMN} marginLeft={SPACING_4}>
        <Text
          textTransform={TEXT_TRANSFORM_UPPERCASE}
          color={C_HARBOR_GRAY}
          fontWeight={FONT_WEIGHT_REGULAR}
          fontSize={FONT_SIZE_CAPTION}
          marginTop={SPACING_2}
        >
          {t('tc_block')}
        </Text>
        <StatusLabel status={status} {...getStatusLabelProps(status)} />
        <Text title="tc_target_temp" fontSize={FONT_SIZE_CAPTION}>
          {t(targetTemp === null ? 'na_temp' : 'target_temp', {
            temp: targetTemp,
          })}
        </Text>
        <Text title="tc_current_temp" fontSize={FONT_SIZE_CAPTION}>
          {t('current_temp', { temp: currentTemp })}
        </Text>
      </Flex>
    </Flex>
  )
}
