import * as React from 'react'
import {
  ALIGN_CENTER,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LEGACY_COLORS,
  SPACING,
} from '@opentrons/components'
import { StyledText } from '../../../atoms/text'

export interface LabeledValueProps {
  label: string
  value: number | string
}

export function LabeledValue({ label, value }: LabeledValueProps): JSX.Element {
  return (
    <Flex
      flexDirection={DIRECTION_ROW}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      alignItems={ALIGN_CENTER}
      paddingY={SPACING.spacing8}
    >
      <StyledText as="h6" color={COLORS.grey50Enabled}>
        {label}
      </StyledText>
      <StyledText as="p">{value}</StyledText>
    </Flex>
  )
}
