import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Flex,
  Text,
  DIRECTION_ROW,
  SPACING_2,
  ALIGN_START,
  DIRECTION_COLUMN,
  SPACING_3,
  TEXT_TRANSFORM_UPPERCASE,
  SPACING_1,
  C_BRIGHT_GRAY,
  C_HARBOR_GRAY,
  Btn,
  FONT_WEIGHT_REGULAR,
  FONT_SIZE_CAPTION,
} from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data'
import { ModuleIcon } from '../ModuleIcon'
import { MagneticModuleData } from './MagneticModuleData'
import { ThermocyclerModuleData } from './ThermocyclerModuleData'

import magneticModule from '../../../assets/images/magnetic_module_gen_2_transparent.svg'
import temperatureModule from '../../../assets/images/temp_deck_gen_2_transparent.svg'
import thermoModule from '../../../assets/images/thermocycler_open_transparent.svg'
import overflow_icon from '../../../assets/images/overflow_icon.svg'

import type { AttachedModule } from '../../../redux/modules/types'

interface ModuleCardProps {
  module: AttachedModule
}

export const ModuleCard = (props: ModuleCardProps): JSX.Element | null => {
  const { t } = useTranslation('device_details')
  const { module } = props

  let image = ''
  let moduleData: JSX.Element = <div></div>
  switch (module.type) {
    case 'magneticModuleType': {
      image = magneticModule
      moduleData = (
        <MagneticModuleData
          moduleStatus={module.status}
          moduleHeight={module.data.height}
          moduleModel={module.model}
        />
      )
      break
    }

    case 'temperatureModuleType': {
      image = temperatureModule
      break
    }

    case 'thermocyclerModuleType': {
      image = thermoModule
      moduleData = (
        <ThermocyclerModuleData
          status={module.status}
          currentTemp={module.data.currentTemp}
          targetTemp={module.data.targetTemp}
          lidTarget={module.data.lidTarget}
          lidTemp={module.data.lidTemp}
        />
      )
      break
    }
  }

  return (
    <Flex
      backgroundColor={C_BRIGHT_GRAY}
      borderRadius={SPACING_1}
      marginBottom={SPACING_2}
      marginLeft={SPACING_2}
      width={'24rem'}
    >
      <Box
        padding={`${SPACING_3} ${SPACING_2} ${SPACING_3} ${SPACING_2}`}
        width="100%"
      >
        <Flex flexDirection={DIRECTION_ROW} paddingRight={SPACING_2}>
          <img src={image} alt={module.model} />
          <Flex flexDirection={DIRECTION_COLUMN} paddingLeft={SPACING_2}>
            <Text
              textTransform={TEXT_TRANSFORM_UPPERCASE}
              color={C_HARBOR_GRAY}
              fontWeight={FONT_WEIGHT_REGULAR}
              fontSize={FONT_SIZE_CAPTION}
              paddingBottom={SPACING_1}
            >
              {t('usb_port', {
                port: module.usbPort.hub ?? module.usbPort.port,
              })}
            </Text>
            <Flex paddingBottom={SPACING_1}>
              <ModuleIcon moduleType={module.type} />
              <Text fontSize={'0.6875rem'}>
                {getModuleDisplayName(module.model)}
              </Text>
            </Flex>
            {moduleData}
          </Flex>
        </Flex>
      </Box>

      <Box alignSelf={ALIGN_START} padding={SPACING_1}>
        <Btn onClick={() => console.log('overflow')} aria-label="overflow">
          <img src={overflow_icon} />
        </Btn>
      </Box>
    </Flex>
  )
}
