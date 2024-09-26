import type * as React from 'react'
import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
} from '@opentrons/components'

interface EmptySetupStepProps {
  title: React.ReactNode
  description: string
  rightElement?: React.ReactNode
}

export function EmptySetupStep(props: EmptySetupStepProps): JSX.Element {
  const { title, description, rightElement } = props
  return (
    <Flex flexDirection={DIRECTION_ROW} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Flex flexDirection={DIRECTION_COLUMN} color={COLORS.grey40}>
        <LegacyStyledText
          css={TYPOGRAPHY.h3SemiBold}
          marginBottom={SPACING.spacing4}
        >
          {title}
        </LegacyStyledText>
        <LegacyStyledText as="p">{description}</LegacyStyledText>
      </Flex>
      {rightElement}
    </Flex>
  )
}
