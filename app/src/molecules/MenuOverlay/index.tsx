import * as React from 'react'

import {
  Flex,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  POSITION_ABSOLUTE,
} from '@opentrons/components'

import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { Divider } from '../../atoms/structure'

import type { StyleProps } from '@opentrons/components'

export interface MenuOverlayItemProps {
  children: React.ReactNode
  onClick: (e: React.MouseEvent) => unknown
}

interface MenuOverlayProps extends StyleProps {
  menuOverlayItems: MenuOverlayItemProps[]
  setShowMenuOverlay: (showMenuOverlay: boolean) => void
  hasDivider?: boolean
}

export function MenuOverlay(props: MenuOverlayProps): JSX.Element {
  const { hasDivider = false, menuOverlayItems, setShowMenuOverlay } = props

  return (
    <Flex
      backgroundColor={COLORS.white}
      borderRadius={BORDERS.radiusSoftCorners}
      boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
      flexDirection={DIRECTION_COLUMN}
      position={POSITION_ABSOLUTE}
      top="2.25rem"
      right="0"
      whiteSpace="nowrap"
      zIndex={10}
      onClick={e => {
        e.preventDefault()
        e.stopPropagation()
        setShowMenuOverlay(false)
      }}
    >
      {menuOverlayItems.map((menuOverlayItem, i) => (
        <React.Fragment key={`menuItem_${i}`}>
          {/* insert a divider before the last item if desired */}
          {hasDivider && i === menuOverlayItems.length - 1 ? <Divider /> : null}
          <MenuItem onClick={menuOverlayItem.onClick}>
            {menuOverlayItem.children}
          </MenuItem>
        </React.Fragment>
      ))}
    </Flex>
  )
}
