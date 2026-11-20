import { BORDERS, Box, SPACING } from '@opentrons/components'

import type { ReactNode } from 'react'
import type { StyleProps } from '@opentrons/components'

export interface VisibleContainerProps extends StyleProps {
  children: JSX.Element | JSX.Element[]
}

export function VisibleContainer({
  children,
  ...styleProps
}: VisibleContainerProps): ReactNode {
  return (
    <Box
      border={BORDERS.lineBorder}
      borderColor="#A864FFFF"
      minWidth="max-content"
      minHeight="max-content"
      maxWidth="100vp"
      maxHeight="100vp"
      padding={SPACING.spacing32}
      {...styleProps}
    >
      {children}
    </Box>
  )
}
