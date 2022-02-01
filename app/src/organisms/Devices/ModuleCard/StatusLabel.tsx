import * as React from 'react'
import {
  Flex,
  Icon,
  Text,
  SPACING_2,
  C_DARK_GRAY,
  JUSTIFY_SPACE_BETWEEN,
  SPACING_1,
  TEXT_TRANSFORM_CAPITALIZE,
  C_BLUE,
  ALIGN_CENTER,
  C_SKY_BLUE,
} from '@opentrons/components'
import {
  TEMPERATURE_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '../../../redux/modules'

interface StatusLabelProps {
  moduleType:
    | typeof TEMPERATURE_MODULE_TYPE
    | typeof MAGNETIC_MODULE_TYPE
    | typeof THERMOCYCLER_MODULE_TYPE
  moduleStatus: string
}

export const StatusLabel = (props: StatusLabelProps): JSX.Element | null => {
  const { moduleType, moduleStatus } = props
  return moduleType === MAGNETIC_MODULE_TYPE ? (
    <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Flex
        backgroundColor={C_SKY_BLUE}
        borderRadius="4px"
        padding={SPACING_1}
        alignItems={ALIGN_CENTER}
        marginTop={SPACING_2}
      >
        <Icon
          name="circle"
          color={C_BLUE}
          size={SPACING_2}
          marginX={SPACING_1}
        />
        <Text
          fontSize={'10px'}
          color={C_DARK_GRAY}
          textTransform={TEXT_TRANSFORM_CAPITALIZE}
          marginRight={SPACING_1}
        >
          {moduleStatus}
        </Text>
      </Flex>
    </Flex>
  ) : null
}
