import * as React from 'react'
import { Box, LEGACY_COLORS,
  COLORS, SPACING } from '@opentrons/components'

type Props = React.ComponentProps<typeof Box>

export function Divider(props: Props): JSX.Element {
  return (
    <Box
      borderBottom={`1px solid ${String(LEGACY_COLORS.medGreyEnabled)}`}
      marginY={SPACING.spacing4}
      {...props}
      data-testid="divider"
    />
  )
}
