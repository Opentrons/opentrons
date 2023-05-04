import { Box, COLORS, SPACING } from '@opentrons/components'
import * as React from 'react'

type Props = React.ComponentProps<typeof Box>

export function Divider(props: Props): JSX.Element {
  return (
    <Box
      borderBottom={`1px solid ${String(COLORS.medGreyEnabled)}`}
      marginY={SPACING.spacing4}
      {...props}
      data-testid="divider"
    />
  )
}
