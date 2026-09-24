import { BORDERS, COLORS } from '../../helix-design-system'
import { ModalShell } from '../../modals'
import { Flex } from '../../primitives'
import {
  DIRECTION_COLUMN,
  JUSTIFY_CENTER,
  POSITION_ABSOLUTE,
} from '../../styles'
import { SPACING } from '../../ui-style-constants'

import type { MouseEventHandler, ReactNode } from 'react'

const MENU_OFFSET = '2.6rem'

interface MenuListProps {
  children: ReactNode
  isOnDevice?: boolean
  onClick?: MouseEventHandler
  opensUpward?: boolean
}

export const MenuList = (props: MenuListProps): JSX.Element | null => {
  const {
    children,
    isOnDevice = false,
    onClick = null,
    opensUpward = false,
  } = props
  return isOnDevice && onClick != null ? (
    <ModalShell
      borderRadius={BORDERS.borderRadius16}
      width="max-content"
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
      data-testid="MenuList" // todo (kk: 2026-08-25): replace data-testid with aria-label + role when refactoring this component
      borderRadius="4px 4px 0px 0px"
      zIndex={10}
      boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
      position={POSITION_ABSOLUTE}
      backgroundColor={COLORS.white}
      {...(opensUpward ? { bottom: MENU_OFFSET } : { top: MENU_OFFSET })}
      // todo(mm, 2026-05-28): This `right` value seems wrong.
      //
      // It means "place the right of the MenuList 4px to the left of the center of the
      // containing element." It is not clear why we ever would have wanted to do that.
      // Our common practice, and I assume our design intent, is for the right of the
      // MenuList to be aligned with the right of the button that triggered it.
      //
      // In practice, I think this component is used in weird places that cause the
      // "50%" part to evaluate to 0, which is why this has not caused obvious layout
      // problems everywhere.
      right={`calc(50% + ${SPACING.spacing4})`}
      flexDirection={DIRECTION_COLUMN}
      width="max-content"
    >
      {children}
    </Flex>
  )
}
