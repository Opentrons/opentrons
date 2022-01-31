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
} from '@opentrons/components'

import magneticModuleV1 from '../../assets/images/modules/magneticModuleV1@3x.png'

interface ModuleCardProps {
  moduleType?: string
  moduleStatus?: string
  port?: number
}

export const ModuleCard = (props: ModuleCardProps): JSX.Element | null => {
  return (
    <Flex
      alignItems={ALIGN_CENTER}
      backgroundColor={'#F8F8F8'}
      borderRadius="4px"
      flexDirection={DIRECTION_ROW}
      marginBottom={SPACING_2}
      padding={SPACING_2}
      width="100%"
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
              {'USB Port < # VIA HUB >'}
            </Text>
            <Text fontSize={'11px'}>Magnetic Module GEN2</Text>
          </Flex>
        </Flex>
      </Box>

      <Box alignSelf={ALIGN_START}>
        <Icon name="dots-horizontal" color={C_DARK_GRAY} size={SIZE_2} />
      </Box>
    </Flex>
  )
}
