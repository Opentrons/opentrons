import * as React from 'react'
import { Portal } from '../../App/portal'
import { COLORS, Overlay } from '@opentrons/components'

interface MenuHandleClickOutside {
  MenuOverlayPortal: React.FC
  handleOverflowClick: React.MouseEventHandler<HTMLButtonElement>
  showOverflowMenu: boolean
  setShowOverflowMenu: React.Dispatch<React.SetStateAction<boolean>>
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

  const MenuOverlayPortal = (): JSX.Element => (
    <Portal level="top">
      {showOverflowMenu ? (
        <Overlay
          onClick={handleClickOutside}
          backgroundColor={COLORS.transparent}
        />
      ) : null}
    </Portal>
  )

  return {
    MenuOverlayPortal,
    handleOverflowClick,
    showOverflowMenu,
    setShowOverflowMenu,
  }
}
