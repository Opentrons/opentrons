import * as React from 'react'
import { Box, BORDERS, SPACING } from '@opentrons/components'

export function StandInContent(): JSX.Element {
  return (
    <Box
      border={'4px dashed #A864FFFF'}
      borderRadius={BORDERS.borderRadius8}
      margin={SPACING.spacing16}
      height="104px"
      backgroundColor="#A864FF19"
    />
  )
}
