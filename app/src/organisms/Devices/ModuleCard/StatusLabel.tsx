import * as React from 'react'
import {
  Flex,
  Icon,
  Text,
  SPACING_2,
  JUSTIFY_SPACE_BETWEEN,
  SPACING_1,
  TEXT_TRANSFORM_CAPITALIZE,
  ALIGN_CENTER,
  C_BLUE_PRESSED,
} from '@opentrons/components'
interface StatusLabelProps {
  moduleStatus: string
  backgroundColor: string
  iconColor: string
}

export const StatusLabel = (props: StatusLabelProps): JSX.Element | null => {
  const { moduleStatus, backgroundColor, iconColor } = props

  return (
    <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Flex
        backgroundColor={backgroundColor}
        borderRadius="4px"
        padding="0.1rem"
        alignItems={ALIGN_CENTER}
        marginTop={SPACING_1}
        marginBottom={SPACING_1}
      >
        <Icon
          name="circle"
          color={iconColor}
          size={SPACING_2}
          marginX={SPACING_1}
        />
        <Text
          fontSize={'0.625rem'}
          color={C_BLUE_PRESSED}
          textTransform={TEXT_TRANSFORM_CAPITALIZE}
          marginRight={SPACING_1}
        >
          {moduleStatus}
        </Text>
      </Flex>
    </Flex>
  )
}
