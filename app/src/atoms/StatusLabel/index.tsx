import * as React from 'react'
import {
  Flex,
  Icon,
  Text,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  ALIGN_CENTER,
  C_BLUE_PRESSED,
  TYPOGRAPHY,
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
        borderRadius={SPACING.spacing2}
        padding="0.2rem"
        alignItems={ALIGN_CENTER}
        marginTop={SPACING.spacing2}
        marginBottom={SPACING.spacing2}
        data-testid={`status_label+${status}`}
      >
        <Icon
          name="circle"
          color={iconColor}
          size={SPACING.spacing2}
          marginX={SPACING.spacing2}
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
          fontSize={TYPOGRAPHY.fontSizeCaption}
          color={textColor ?? C_BLUE_PRESSED}
          textTransform={TYPOGRAPHY.textTransformCapitalize}
          marginRight={SPACING.spacing2}
        >
          {status}
        </Text>
      </Flex>
    </Flex>
  )
}
