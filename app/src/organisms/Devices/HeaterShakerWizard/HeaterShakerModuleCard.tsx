import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  Icon,
  SIZE_1,
  TYPOGRAPHY,
  DIRECTION_ROW,
  DIRECTION_COLUMN,
  SPACING,
  ALIGN_FLEX_START,
  COLORS,
} from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data'
import { StyledText } from '../../../atoms/text'
import heaterShakerModule from '../../../assets/images/heater_shaker_module_transparent.png'
import { HeaterShakerModuleData } from '../../ModuleCard/HeaterShakerModuleData'

import type { HeaterShakerModule } from '../../../redux/modules/types'

interface HeaterShakerModuleCardProps {
  module: HeaterShakerModule
}

export const HeaterShakerModuleCard = (
  props: HeaterShakerModuleCardProps
): JSX.Element | null => {
  const { module } = props
  const { t } = useTranslation('device_details')

  return (
    <Flex
      backgroundColor={COLORS.fundamentalsBackground}
      borderRadius={SPACING.spacing4}
      marginBottom={SPACING.spacing8}
      padding={`${SPACING.spacing16} ${SPACING.spacing8} ${SPACING.spacing16} ${SPACING.spacing8}`}
      width="20rem"
    >
      <Flex
        flexDirection={DIRECTION_ROW}
        paddingRight={SPACING.spacing8}
        alignItems={ALIGN_FLEX_START}
      >
        <img src={heaterShakerModule} alt="Heater-Shaker" />
        <Flex flexDirection={DIRECTION_COLUMN} paddingLeft={SPACING.spacing8}>
          <StyledText
            textTransform={TYPOGRAPHY.textTransformUppercase}
            color={COLORS.darkGreyEnabled}
            fontWeight={TYPOGRAPHY.fontWeightRegular}
            fontSize={TYPOGRAPHY.fontSizeCaption}
            paddingBottom={SPACING.spacing4}
          >
            {module?.usbPort !== null
              ? t('usb_port', {
                  port: module?.usbPort?.port,
                })
              : t('usb_port_not_connected')}
          </StyledText>
          <Flex paddingBottom={SPACING.spacing4}>
            <Icon
              name="ot-heater-shaker"
              aria-label="heater-shaker"
              size={SIZE_1}
              marginRight={SPACING.spacing4}
              color={COLORS.darkGreyEnabled}
            />
            <StyledText fontSize={TYPOGRAPHY.fontSizeP}>
              {getModuleDisplayName(module.moduleModel)}
            </StyledText>
          </Flex>
          <HeaterShakerModuleData
            moduleData={module.data}
            showTemperatureData={false}
          />
        </Flex>
      </Flex>
    </Flex>
  )
}
