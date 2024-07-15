import * as React from 'react'

import { Box, BORDERS, SPACING } from '@opentrons/components'

export interface VisibleContainerProps {
  children: JSX.Element | JSX.Element[]
}

export function VisibleContainer({
  children,
}: VisibleContainerProps): JSX.Element {
  return (
    <Box
      border={BORDERS.lineBorder}
      borderColor="#A864FFFF"
      minWidth="max-content"
      minHeight="max-content"
      maxWidth="100vp"
      maxHeight="100vp"
      padding={SPACING.spacing32}
    >
      {children}
    </Box>
  )
}
