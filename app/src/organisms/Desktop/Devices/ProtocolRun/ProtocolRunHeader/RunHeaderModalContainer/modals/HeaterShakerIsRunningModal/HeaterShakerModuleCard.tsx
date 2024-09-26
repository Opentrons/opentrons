import { useTranslation } from 'react-i18next'

import {
  ALIGN_FLEX_START,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  SIZE_1,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data'

import heaterShakerModule from '/app/assets/images/heater_shaker_module_transparent.png'
import { HeaterShakerModuleData } from '/app/organisms/ModuleCard/HeaterShakerModuleData'

import type { HeaterShakerModule } from '/app/redux/modules/types'

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
      backgroundColor={COLORS.grey10}
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
          <LegacyStyledText
            textTransform={TYPOGRAPHY.textTransformUppercase}
            color={COLORS.grey50}
            fontWeight={TYPOGRAPHY.fontWeightRegular}
            fontSize={TYPOGRAPHY.fontSizeCaption}
            paddingBottom={SPACING.spacing4}
          >
            {module?.usbPort !== null
              ? t('usb_port', {
                  port: module?.usbPort?.port,
                })
              : t('usb_port_not_connected')}
          </LegacyStyledText>
          <Flex paddingBottom={SPACING.spacing4}>
            <Icon
              name="ot-heater-shaker"
              aria-label="heater-shaker"
              size={SIZE_1}
              marginRight={SPACING.spacing4}
              color={COLORS.grey50}
            />
            <LegacyStyledText fontSize={TYPOGRAPHY.fontSizeP}>
              {getModuleDisplayName(module.moduleModel)}
            </LegacyStyledText>
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
