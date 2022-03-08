import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  Text,
  Icon,
  SIZE_1,
  TYPOGRAPHY,
  TEXT_TRANSFORM_UPPERCASE,
  DIRECTION_ROW,
  DIRECTION_COLUMN,
  SPACING,
  ALIGN_FLEX_START,
  COLORS,
} from '@opentrons/components'
import heaterShakerModule from '../../../assets/images/heatershaker_module_transparent.svg'
import { HeaterShakerModuleData } from '../ModuleCard/HeaterShakerModuleData'

import type { AttachedModule } from '../../../redux/modules/types'

interface HeaterShakerModuleCardProps {
  module: AttachedModule | null
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
      marginLeft={SPACING.spacing3}
      padding={`${SPACING.spacing4} ${SPACING.spacing3} ${SPACING.spacing4} ${SPACING.spacing3}`}
      width={'20rem'}
    >
      <Flex
        flexDirection={DIRECTION_ROW}
        paddingRight={SPACING.spacing3}
        alignItems={ALIGN_FLEX_START}
      >
        <img src={heaterShakerModule} alt={'Heater Shaker'} />
        <Flex flexDirection={DIRECTION_COLUMN} paddingLeft={SPACING.spacing3}>
          <Text
            textTransform={TEXT_TRANSFORM_UPPERCASE}
            color={COLORS.darkGreyEnabled}
            fontWeight={TYPOGRAPHY.fontWeightRegular}
            fontSize={TYPOGRAPHY.fontSizeCaption}
            paddingBottom={SPACING.spacing2}
          >
            {t(module?.usbPort.port === null ? 'usb_hub' : 'usb_port', {
              port: module?.usbPort.hub ?? module?.usbPort.port,
            })}
          </Text>
          <Flex paddingBottom={SPACING.spacing2}>
            <Icon
              name={'ot-heater-shaker'}
              size={SIZE_1}
              marginRight={SPACING.spacing2}
              color={COLORS.darkGreyEnabled}
            />
            <Text fontSize={TYPOGRAPHY.fontSizeP}>{'Heater/Shaker GENX'}</Text>
          </Flex>
          {module?.type === 'heaterShakerModuleType' ? (
            <HeaterShakerModuleData
              heaterStatus={module.data.temperatureStatus}
              shakerStatus={module.data.speedStatus}
              latchStatus={module.data.labwareLatchStatus}
              targetTemp={module.data.targetTemp}
              currentTemp={module.data.currentTemp}
              targetSpeed={module.data.targetSpeed}
              currentSpeed={module.data.currentSpeed}
              showTemperatureData={false}
            />
          ) : null}
        </Flex>
      </Flex>
    </Flex>
  )
}
