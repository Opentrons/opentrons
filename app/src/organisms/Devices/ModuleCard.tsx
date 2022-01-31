import * as React from 'react'

import {
  Box,
  Flex,
  Icon,
  Text,
  ALIGN_CENTER,
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
} from '@opentrons/components'
import { AttachedModule } from '../../redux/modules/types'
import {
  getModuleDisplayName,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import magneticModuleV1 from '../../assets/images/modules/magneticModuleV1@3x.png'

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
  const { module } = props

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      backgroundColor={'#F8F8F8'}
      borderRadius="4px"
      flexDirection={DIRECTION_ROW}
      marginBottom={SPACING_2}
      marginLeft={SPACING_2}
      padding={SPACING_2}
      width="47%"
    >
      <Box padding={SPACING_2} width="100%">
        <Flex flexDirection={DIRECTION_ROW} paddingRight={SPACING_3}>
          <img src={magneticModuleV1} style={{ width: '6rem' }} />
          <Flex flexDirection={DIRECTION_COLUMN} paddingLeft={SPACING_2}>
            <Text
              textTransform={TEXT_TRANSFORM_UPPERCASE}
              color={'#8A8C8E'}
              fontWeight={'400'}
              fontSize={'10px'}
            >
              {/* TODO (sh, 2021-01-31): Conditionally render title here based on usbPort info */}
              {'USB Port < # VIA HUB >'}
            </Text>
            <Flex>
              <ModuleIcon moduleType={module.type} />
              <Text fontSize={'11px'}>
                {getModuleDisplayName(module.model)}
              </Text>
            </Flex>
            {module.type === MAGNETIC_MODULE_TYPE ? (
              <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
                {module.status}
              </Flex>
            ) : null}
            {module.type === THERMOCYCLER_MODULE_TYPE ? (
              <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
                <Text
                  textTransform={TEXT_TRANSFORM_UPPERCASE}
                  color={'#8A8C8E'}
                  fontWeight={'400'}
                  fontSize={'10px'}
                  marginTop={SPACING_2}
                >
                  Lid
                </Text>
                <Text
                  textTransform={TEXT_TRANSFORM_UPPERCASE}
                  color={'#8A8C8E'}
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
        {/* TODO (sh, 2021-01-31): Export vertical dots icon SVG and add to icon types */}
        <Icon name="dots-horizontal" color={C_DARK_GRAY} size={SIZE_2} />
      </Box>
    </Flex>
  )
}
