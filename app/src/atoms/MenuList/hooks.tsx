import * as React from 'react'
import { LEGACY_COLORS, Overlay } from '@opentrons/components'

interface MenuHandleClickOutside {
  menuOverlay: JSX.Element
  handleOverflowClick: React.MouseEventHandler<HTMLButtonElement>
  showOverflowMenu: boolean
  setShowOverflowMenu: React.Dispatch<React.SetStateAction<boolean>>
}

export function useMenuHandleClickOutside(): MenuHandleClickOutside {
  const [showOverflowMenu, setShowOverflowMenu] = React.useState<boolean>(false)

  const handleOverflowClick: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    setShowOverflowMenu(currentShowOverflowMenu => !currentShowOverflowMenu)
  }

  const handleClickOutside: React.MouseEventHandler<HTMLDivElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    setShowOverflowMenu(false)
  }

  const menuOverlay: JSX.Element = (
    <>
      {showOverflowMenu ? (
        <Overlay
          onClick={handleClickOutside}
          backgroundColor={LEGACY_COLORS.transparent}
        />
      ) : null}
    </>
  )

  return {
    menuOverlay,
    handleOverflowClick,
    showOverflowMenu,
    setShowOverflowMenu,
  }
}
