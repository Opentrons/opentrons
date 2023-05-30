import * as React from 'react'
import {
  COLORS,
  POSITION_ABSOLUTE,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  BORDERS,
  JUSTIFY_CENTER,
} from '@opentrons/components'
import { ModalShell } from '../../molecules/Modal'

interface MenuListProps {
  children: React.ReactNode
  isOnDevice?: boolean
  onClick?: React.MouseEventHandler
}

export const MenuList = (props: MenuListProps): JSX.Element | null => {
  const { children, isOnDevice = false, onClick = null } = props
  return isOnDevice && onClick != null ? (
    <ModalShell
      borderRadius={BORDERS.size3}
      width="18.9375rem"
      onOutsideClick={onClick}
    >
      <Flex
        boxShadow={BORDERS.shadowSmall}
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_CENTER}
      >
        {children}
      </Flex>
    </ModalShell>
  ) : (
    <Flex
      borderRadius="4px 4px 0px 0px"
      zIndex={10}
      boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
      position={POSITION_ABSOLUTE}
      backgroundColor={COLORS.white}
      top="2.6rem"
      right={`calc(50% + ${SPACING.spacing4})`}
      flexDirection={DIRECTION_COLUMN}
      width="max-content"
    >
      {children}
    </Flex>
  )
}
