import type * as React from 'react'
import { Box, BORDERS } from '@opentrons/components'

export function StandInContent({
  children,
}: {
  children?: React.ReactNode
}): JSX.Element {
  return (
    <Box
      border={'4px dashed #A864FFFF'}
      borderRadius={BORDERS.borderRadius8}
      height="104px"
      backgroundColor="#A864FF19"
    >
      {children}
    </Box>
  )
}
