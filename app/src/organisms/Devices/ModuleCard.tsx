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
  JUSTIFY_SPACE_BETWEEN,
  SPACING_1,
  C_BRIGHT_GRAY,
  C_HARBOR_GRAY,
  Btn,
} from '@opentrons/components'
import { AttachedModule } from '../../redux/modules/types'
import {
  getModuleDisplayName,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import magneticModule from '../../assets/images/magnetic_module_gen_2_transparent.svg'
import temperatureModule from '../../assets/images/temp_deck_gen_2_transparent.svg'
import thermoModule from '../../assets/images/thermocycler_open_transparent.svg'
import magneticModuleEngaged from '../../assets/images/ModuleCard_status_engaged.svg'
import magneticModuleDisenaged from '../../assets/images/ModuleCard_status_disengaged.svg'

interface ModuleCardProps {
  module: AttachedModule
}

const iconNamesByModuleType = {
  [MAGNETIC_MODULE_TYPE]: 'ot-magnet',
  [TEMPERATURE_MODULE_TYPE]: 'ot-temperature',
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
      marginRight={SPACING_2}
    />
  )
}

export const ModuleCard = (props: ModuleCardProps): JSX.Element | null => {
  const { t } = useTranslation('device_details')
  const { module } = props

  let image = ''
  if (module.type === 'magneticModuleType') {
    image = magneticModule
  } else if (module.type === 'temperatureModuleType') {
    image = temperatureModule
  } else if (module.type === 'thermocyclerModuleType') {
    image = thermoModule
  }

  return (
    <Flex
      backgroundColor={C_BRIGHT_GRAY}
      borderRadius="4px"
      marginBottom={SPACING_2}
      marginLeft={SPACING_2}
      padding={SPACING_2}
      width="49%"
    >
      <Box padding={SPACING_2} width="100%">
        <Flex flexDirection={DIRECTION_ROW} paddingRight={SPACING_3}>
          <img src={image} style={{ width: '6rem' }} />
          <Flex flexDirection={DIRECTION_COLUMN} paddingLeft={SPACING_2}>
            <Text
              textTransform={TEXT_TRANSFORM_UPPERCASE}
              color={C_HARBOR_GRAY}
              fontWeight={'400'}
              fontSize={'10px'}
              paddingBottom={SPACING_1}
            >
              {/* TODO (sh, 2021-01-31): Conditionally render title here based on usbPort info */}
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
            {module.type === MAGNETIC_MODULE_TYPE ? (
              <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
                {module.status === 'engaged' ? (
                  <img src={magneticModuleEngaged} style={{ width: '5rem' }} />
                ) : (
                  <img
                    src={magneticModuleDisenaged}
                    style={{ width: '5rem' }}
                  />
                )}
              </Flex>
            ) : null}
            {module.type === THERMOCYCLER_MODULE_TYPE ? (
              <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
                <Text
                  textTransform={TEXT_TRANSFORM_UPPERCASE}
                  color={C_HARBOR_GRAY}
                  fontWeight={'400'}
                  fontSize={'10px'}
                  marginTop={SPACING_2}
                >
                  Lid
                </Text>
                <Text
                  textTransform={TEXT_TRANSFORM_UPPERCASE}
                  color={C_HARBOR_GRAY}
                  fontWeight={'400'}
                  fontSize={'10px'}
                  marginTop={SPACING_2}
                >
                  Block
                </Text>
              </Flex>
            ) : null}
          </Flex>
        </Flex>
      </Box>

      <Box alignSelf={ALIGN_START}>
        <Btn
          onClick={() => console.log('set engage height')}
          aria-label="close"
        >
          {/* TODO (sh, 2021-01-31): Export vertical dots icon SVG and add to icon types */}
          <Icon name="dots-horizontal" color={C_DARK_GRAY} size={SIZE_2} />
        </Btn>
      </Box>
    </Flex>
  )
}
