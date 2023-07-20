import * as React from 'react'
import {
  Flex,
  DIRECTION_COLUMN,
  COLORS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { StyledText } from '../../../atoms/text'

interface EmptySetupStepProps {
  title: React.ReactNode
  description: string
  label: string
}

export function EmptySetupStep(props: EmptySetupStepProps): JSX.Element {
  const { title, description, label } = props
  return (
    <Flex flexDirection={DIRECTION_COLUMN} color={COLORS.successDisabled}>
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
