import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  SPACING,
} from '@opentrons/components'

import type { ReactNode } from 'react'

export interface LabeledValueProps {
  label: string
  value: number | string
}

export function LabeledValue({ label, value }: LabeledValueProps): ReactNode {
  return (
    <Flex
      flexDirection={DIRECTION_ROW}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      alignItems={ALIGN_CENTER}
      paddingY={SPACING.spacing8}
    >
      <LegacyStyledText forwardedAs="h6" color={COLORS.grey60}>
        {label}
      </LegacyStyledText>
      <LegacyStyledText forwardedAs="p">{value}</LegacyStyledText>
    </Flex>
  )
}
