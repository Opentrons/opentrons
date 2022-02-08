import * as React from 'react'
import { Box, COLORS } from '@opentrons/components'

interface OverflowMenuProps {
  children: React.ReactNode
}

export const OverflowMenu = (props: OverflowMenuProps): JSX.Element | null => {
  return (
    <Box
      borderRadius="4px 4px 0px 0px"
      boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
      z-index="top"
      position="absolute"
      backgroundColor={COLORS.white}
    >
      {props.children}
    </Box>
  )
}
