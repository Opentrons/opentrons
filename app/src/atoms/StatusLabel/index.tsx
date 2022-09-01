import * as React from 'react'
import {
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  ALIGN_CENTER,
  COLORS,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../text'
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
          {pulse != null && pulse ? (
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
        <StyledText
          fontSize={TYPOGRAPHY.fontSizeCaption}
          color={textColor ?? COLORS.bluePressed}
          textTransform={TYPOGRAPHY.textTransformCapitalize}
          marginRight={SPACING.spacing2}
        >
          {status}
        </StyledText>
      </Flex>
    </Flex>
  )
}
