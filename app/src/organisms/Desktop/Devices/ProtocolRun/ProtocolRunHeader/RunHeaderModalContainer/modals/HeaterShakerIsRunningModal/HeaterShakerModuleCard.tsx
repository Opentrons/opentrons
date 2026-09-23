import {
  ALIGN_FLEX_START,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  LegacyStyledText,
  SIZE_1,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data'

import heaterShakerModule from '/app/assets/images/heater_shaker_module_transparent.png'
import { useModuleUSBPort } from '/app/local-resources/modules'
import { HeaterShakerModuleData } from '/app/organisms/ModuleCard/HeaterShakerModuleData'

import type { HeaterShakerModule } from '@opentrons/api-client'

interface HeaterShakerModuleCardProps {
  module: HeaterShakerModule
}

export const HeaterShakerModuleCard = (
  props: HeaterShakerModuleCardProps
): JSX.Element | null => {
  const { module } = props
  const { parseModuleUSBPort } = useModuleUSBPort()

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
            {parseModuleUSBPort(module)}
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
