import { Box, COLORS, SPACING } from '@opentrons/components'

import type { ComponentProps, ReactNode } from 'react'

type Props = ComponentProps<typeof Box>

/*
 * ToDo
 * from a semantic standpoint, we should replace div with hr.
 */
export function Divider(props: Props): ReactNode {
  const { marginY } = props
  return (
    <Box
      role="separator"
      borderBottom={`1px solid ${String(COLORS.grey30)}`}
      marginY={marginY ?? SPACING.spacing4}
      {...props}
    />
  )
}
