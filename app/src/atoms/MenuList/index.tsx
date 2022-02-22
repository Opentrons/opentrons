import * as React from 'react'
import {
  Box,
  COLORS,
  POSITION_ABSOLUTE,
  SPACING_1,
  ButtonProps,
  DIRECTION_COLUMN,
} from '@opentrons/components'

interface MenuListProps {
  buttons: Array<ButtonProps | null | undefined>
}

export const MenuList = (props: MenuListProps): JSX.Element | null => {
  return (
    <Box
      borderRadius={'4px 4px 0px 0px'}
      boxShadow={'0px 1px 3px rgba(0, 0, 0, 0.2)'}
      position={POSITION_ABSOLUTE}
      backgroundColor={COLORS.white}
      top="2.6rem"
      right={`calc(50% + ${SPACING_1})`}
      flexDirection={DIRECTION_COLUMN}
    >
      {props.buttons}
    </Box>
  )
}
