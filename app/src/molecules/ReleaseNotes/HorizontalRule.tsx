import { Box, COLORS, SPACING } from '@opentrons/components'

export function HorizontalRule(): JSX.Element {
  return (
    <Box
      borderBottom={`1px solid ${String(COLORS.grey30)}`}
      marginY={SPACING.spacing16}
      data-testid="divider"
    />
  )
}
