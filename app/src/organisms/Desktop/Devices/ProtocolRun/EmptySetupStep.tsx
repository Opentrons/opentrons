import {
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import type { ReactNode } from 'react'

interface EmptySetupStepProps {
  title: ReactNode
  description: string
  rightElement?: ReactNode
}

export function EmptySetupStep(props: EmptySetupStepProps): ReactNode {
  const { title, description, rightElement } = props
  return (
    <Flex flexDirection={DIRECTION_ROW} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Flex flexDirection={DIRECTION_COLUMN} color={COLORS.grey40}>
        <StyledText
          forwardedAs="h3"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          marginBottom={SPACING.spacing4}
        >
          {title}
        </StyledText>
        <StyledText forwardedAs="p">{description}</StyledText>
      </Flex>
      {rightElement}
    </Flex>
  )
}
