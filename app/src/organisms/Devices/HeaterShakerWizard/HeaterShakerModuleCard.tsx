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
import heaterShakerModule from '../../../assets/images/heatershaker_module_transparent.svg'
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
      backgroundColor={COLORS.background}
      borderRadius={SPACING.spacing2}
      marginBottom={SPACING.spacing3}
      padding={`${SPACING.spacing4} ${SPACING.spacing3} ${SPACING.spacing4} ${SPACING.spacing3}`}
      width="20rem"
    >
      <Flex
        flexDirection={DIRECTION_ROW}
        paddingRight={SPACING.spacing3}
        alignItems={ALIGN_FLEX_START}
      >
        <img src={heaterShakerModule} alt="Heater-Shaker" />
        <Flex flexDirection={DIRECTION_COLUMN} paddingLeft={SPACING.spacing3}>
          <StyledText
            textTransform={TYPOGRAPHY.textTransformUppercase}
            color={COLORS.darkGreyEnabled}
            fontWeight={TYPOGRAPHY.fontWeightRegular}
            fontSize={TYPOGRAPHY.fontSizeCaption}
            paddingBottom={SPACING.spacing2}
          >
            {t(module?.usbPort.port === null ? 'usb_hub' : 'usb_port', {
              port: module?.usbPort.hub ?? module?.usbPort.port,
            })}
          </StyledText>
          <Flex paddingBottom={SPACING.spacing2}>
            <Icon
              name="ot-heater-shaker"
              aria-label="heater-shaker"
              size={SIZE_1}
              marginRight={SPACING.spacing2}
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
