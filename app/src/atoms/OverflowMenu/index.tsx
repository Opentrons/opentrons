import * as React from 'react'
import {
  Box,
  COLORS,
  POSITION_ABSOLUTE,
  SPACING_1,
  TYPOGRAPHY,
} from '@opentrons/components'

interface OverflowMenuProps {
  children: React.ReactNode
}

export const OverflowMenu = (props: OverflowMenuProps): JSX.Element | null => {
  return (
    <Box
      borderRadius={TYPOGRAPHY.borderRadiusS}
      boxShadow={TYPOGRAPHY.boxShadowS}
      position={POSITION_ABSOLUTE}
      backgroundColor={COLORS.white}
      top="2.6rem"
      right={`calc(50% + ${SPACING_1})`}
    >
      {props.children}
    </Box>
  )
}
