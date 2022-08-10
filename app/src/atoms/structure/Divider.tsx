import * as React from 'react'
import { Box, C_LIGHT_GRAY, SPACING } from '@opentrons/components'

type Props = React.ComponentProps<typeof Box>

export function Divider(props: Props): JSX.Element {
  // TODO change color from C_LIGHT_GRAY to the correct color
  return (
    <Box
      borderBottom={`1px solid ${C_LIGHT_GRAY}`}
      marginY={SPACING.spacing2}
      {...props}
    />
  )
}
