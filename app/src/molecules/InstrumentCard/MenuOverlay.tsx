import * as React from 'react'

import {
  Flex,
  BORDERS,
  LEGACY_COLORS,
  DIRECTION_COLUMN,
  POSITION_ABSOLUTE,
} from '@opentrons/components'

import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { Divider } from '../../atoms/structure'

import type { StyleProps } from '@opentrons/components'

export interface MenuOverlayItemProps {
  label: React.ReactNode
  onClick: React.MouseEventHandler<HTMLButtonElement>
  disabled?: boolean
}

interface MenuOverlayProps extends StyleProps {
  menuOverlayItems: MenuOverlayItemProps[]
  setShowMenuOverlay: (showMenuOverlay: boolean) => void
  hasDivider?: boolean
}

// TODO(bh, 2022-10-31): consider making this a generic molecule if other overflow menus are refactored to use
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
          {hasDivider && i === menuOverlayItems.length - 1 ? (
            <Divider marginY="0" />
          ) : null}
          <MenuItem
            disabled={menuOverlayItem.disabled}
            onClick={menuOverlayItem.onClick}
          >
            {menuOverlayItem.label}
          </MenuItem>
        </React.Fragment>
      ))}
    </Flex>
  )
}
