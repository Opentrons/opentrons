import * as React from 'react'
import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

interface EmptySetupStepProps {
  title: React.ReactNode
  description: string
  label: string
}

export function EmptySetupStep(props: EmptySetupStepProps): JSX.Element {
  const { title, description, label } = props
  return (
    <Flex flexDirection={DIRECTION_COLUMN} color={COLORS.grey40}>
      <StyledText css={TYPOGRAPHY.h6SemiBold} marginBottom={SPACING.spacing2}>
        {label}
      </StyledText>
      <StyledText css={TYPOGRAPHY.h3SemiBold} marginBottom={SPACING.spacing4}>
        {title}
      </StyledText>
      <StyledText as="p">{description}</StyledText>
    </Flex>
  )
}
