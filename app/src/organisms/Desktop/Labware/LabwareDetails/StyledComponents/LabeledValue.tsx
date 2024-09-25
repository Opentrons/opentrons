import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  LegacyStyledText,
} from '@opentrons/components'

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
      <LegacyStyledText as="h6" color={COLORS.grey60}>
        {label}
      </LegacyStyledText>
      <LegacyStyledText as="p">{value}</LegacyStyledText>
    </Flex>
  )
}
