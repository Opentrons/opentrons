import * as React from 'react'
import { Box, COLORS, SPACING } from '@opentrons/components'

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
