import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Flex,
  Icon,
  Text,
  DIRECTION_ROW,
  SPACING_2,
  ALIGN_START,
  C_DARK_GRAY,
  SIZE_2,
  DIRECTION_COLUMN,
  SPACING_3,
  TEXT_TRANSFORM_UPPERCASE,
  SIZE_1,
  SPACING_1,
  C_BRIGHT_GRAY,
  C_HARBOR_GRAY,
  Btn,
  FONT_WEIGHT_REGULAR,
  C_BLUE_PRESSED,
} from '@opentrons/components'
import {
  getModuleDisplayName,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import magneticModule from '../../../assets/images/magnetic_module_gen_2_transparent.svg'
import temperatureModule from '../../../assets/images/temp_deck_gen_2_transparent.svg'
import thermoModule from '../../../assets/images/thermocycler_open_transparent.svg'
import overflow_icon from '../../../assets/images/overflow_icon.svg'

import type { AttachedModule } from '../../../redux/modules/types'
import { MagneticModuleData } from './MagneticModuleData'

interface ModuleCardProps {
  module: AttachedModule
}

const iconNamesByModuleType = {
  [MAGNETIC_MODULE_TYPE]: 'ot-magnet-v2',
  [TEMPERATURE_MODULE_TYPE]: 'ot-temperature-v2',
  [THERMOCYCLER_MODULE_TYPE]: 'ot-thermocycler',
} as const

const ModuleIcon = ({
  moduleType,
}: {
  moduleType:
    | typeof MAGNETIC_MODULE_TYPE
    | typeof TEMPERATURE_MODULE_TYPE
    | typeof THERMOCYCLER_MODULE_TYPE
}): JSX.Element => {
  return (
    <Icon
      name={iconNamesByModuleType[moduleType]}
      size={SIZE_1}
      marginRight={SPACING_1}
      color={C_HARBOR_GRAY}
    />
  )
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
      break
    }
  }

  return (
    <Flex
      backgroundColor={C_BRIGHT_GRAY}
      borderRadius="4px"
      marginBottom={SPACING_2}
      marginLeft={SPACING_2}
      padding={SPACING_2}
      width={'24rem'}
    >
      <Box padding={SPACING_2} width="100%">
        <Flex flexDirection={DIRECTION_ROW} paddingRight={SPACING_3}>
          <img src={image} alt={module.model} />
          <Flex flexDirection={DIRECTION_COLUMN} paddingLeft={SPACING_2}>
            <Text
              textTransform={TEXT_TRANSFORM_UPPERCASE}
              color={C_HARBOR_GRAY}
              fontWeight={FONT_WEIGHT_REGULAR}
              fontSize={'0.625rem'}
              paddingBottom={SPACING_1}
            >
              {t('usb_port', {
                port: module.usbPort.hub ?? module.usbPort.port,
              })}
            </Text>
            <Flex paddingBottom={SPACING_1}>
              <ModuleIcon moduleType={module.type} />
              <Text fontSize={'11px'}>
                {getModuleDisplayName(module.model)}
              </Text>
            </Flex>
            {moduleData}
          </Flex>
        </Flex>
      </Box>

      <Box alignSelf={ALIGN_START}>
        <Btn onClick={() => console.log('overflow')} aria-label="overflow">
          <img src={overflow_icon} />
        </Btn>
      </Box>
    </Flex>
  )
}
