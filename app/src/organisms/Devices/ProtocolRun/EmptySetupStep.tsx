import * as React from 'react'
import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  LegacyStyledText,
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
      <LegacyStyledText
        css={TYPOGRAPHY.h6SemiBold}
        marginBottom={SPACING.spacing2}
      >
        {label}
      </LegacyStyledText>
      <LegacyStyledText
        css={TYPOGRAPHY.h3SemiBold}
        marginBottom={SPACING.spacing4}
      >
        {title}
      </LegacyStyledText>
      <LegacyStyledText as="p">{description}</LegacyStyledText>
    </Flex>
  )
}
