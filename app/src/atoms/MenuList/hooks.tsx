import * as React from 'react'
import { Portal } from '../../App/portal'
import { COLORS, Overlay } from '@opentrons/components'

interface MenuHandleClickOutside {
  MenuOverlayPortal: React.FC
  handleOverflowClick: React.MouseEventHandler<HTMLButtonElement>
  showOverflowMenu: boolean
  setShowOverflowMenu: React.Dispatch<React.SetStateAction<boolean>>
}

interface MenuOverlayPortalProps {
  children?: React.ReactNode
}

export function useMenuHandleClickOutside(): MenuHandleClickOutside {
  const [showOverflowMenu, setShowOverflowMenu] = React.useState<boolean>(false)

  const handleOverflowClick: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    setShowOverflowMenu(!showOverflowMenu)
  }

  const handleClickOutside: React.MouseEventHandler<HTMLDivElement> = e => {
    e.preventDefault()
    setShowOverflowMenu(false)
  }

  const MenuOverlayPortal = (props: MenuOverlayPortalProps): JSX.Element => (
    <Portal level="top">
      {showOverflowMenu ? (
        <Overlay
          onClick={handleClickOutside}
          backgroundColor={COLORS.transparent}
        />
      ) : null}
      {props.children}
    </Portal>
  )

  return {
    MenuOverlayPortal,
    handleOverflowClick,
    showOverflowMenu,
    setShowOverflowMenu,
  }
}
