import * as React from 'react'
import {
  COLORS,
  POSITION_ABSOLUTE,
  DIRECTION_COLUMN,
  ButtonProps,
  Flex,
  SPACING,
} from '@opentrons/components'

interface MenuListProps {
  buttons: Array<ButtonProps | null | undefined>
}

export const MenuList = (props: MenuListProps): JSX.Element | null => {
  return (
    <Flex
      borderRadius={'4px 4px 0px 0px'}
      zIndex={10}
      boxShadow={'0px 1px 3px rgba(0, 0, 0, 0.2)'}
      position={POSITION_ABSOLUTE}
      backgroundColor={COLORS.white}
      top="2.6rem"
      right={`calc(50% + ${SPACING.spacing2})`}
      flexDirection={DIRECTION_COLUMN}
      whiteSpace="nowrap"
    >
      {props.buttons}
    </Flex>
  )
}
