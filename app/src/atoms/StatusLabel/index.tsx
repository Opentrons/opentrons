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
  pulse?: boolean
}

export const StatusLabel = (props: StatusLabelProps): JSX.Element | null => {
  const { status, backgroundColor, iconColor, textColor, pulse } = props

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
          data-testid="status_circle"
        >
          {pulse ? (
            <animate
              attributeName="fill"
              values={`${iconColor}; transparent`}
              dur="1s"
              calcMode="discrete"
              repeatCount="indefinite"
              data-testid="pulsing_status_circle"
            />
          ) : null}
        </Icon>
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
