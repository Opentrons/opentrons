import * as React from 'react'
import {
  Flex,
  Icon,
  Text,
  JUSTIFY_SPACE_BETWEEN,
  SPACING_1,
  TEXT_TRANSFORM_CAPITALIZE,
  ALIGN_CENTER,
  C_BLUE_PRESSED,
  FONT_SIZE_CAPTION,
} from '@opentrons/components'
interface StatusLabelProps {
  status: string
  backgroundColor: string
  iconColor: string
  textColor?: string
}

export const StatusLabel = (props: StatusLabelProps): JSX.Element | null => {
  const { status, backgroundColor, iconColor, textColor } = props

  return (
    <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Flex
        backgroundColor={backgroundColor}
        borderRadius={SPACING_1}
        padding="0.2rem"
        alignItems={ALIGN_CENTER}
        marginTop={SPACING_1}
        marginBottom={SPACING_1}
      >
        <Icon
          name="circle"
          color={iconColor}
          size={SPACING_1}
          marginX={SPACING_1}
        />
        <Text
          fontSize={FONT_SIZE_CAPTION}
          color={textColor ?? C_BLUE_PRESSED}
          textTransform={TEXT_TRANSFORM_CAPITALIZE}
          marginRight={SPACING_1}
        >
          {status}
        </Text>
      </Flex>
    </Flex>
  )
}
