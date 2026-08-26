import { Box, COLORS, SPACING } from '../..'

import type { ComponentProps, ReactNode } from 'react'

type Props = ComponentProps<typeof Box>

export function Divider(props: Props): ReactNode {
  return (
    <Box
      borderBottom={`1px solid ${String(COLORS.grey30)}`}
      marginY={SPACING.spacing4}
      {...props}
      data-testid="divider"
    />
  )
}
