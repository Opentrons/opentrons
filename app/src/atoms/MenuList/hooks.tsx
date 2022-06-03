import * as React from 'react'
import { COLORS, Overlay } from '@opentrons/components'

interface MenuHandleClickOutside {
  MenuOverlay: React.FC
  handleOverflowClick: React.MouseEventHandler<HTMLButtonElement>
  showOverflowMenu: boolean
  setShowOverflowMenu: React.Dispatch<React.SetStateAction<boolean>>
}

export function useMenuHandleClickOutside(): MenuHandleClickOutside {
  const [showOverflowMenu, setShowOverflowMenu] = React.useState<boolean>(false)

  const handleOverflowClick: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    setShowOverflowMenu(!showOverflowMenu)
  }

  const handleClickOutside: React.MouseEventHandler<HTMLDivElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    setShowOverflowMenu(false)
  }

  const MenuOverlay = (): JSX.Element => (
    <>
      {showOverflowMenu ? (
        <Overlay
          onClick={handleClickOutside}
          backgroundColor={COLORS.transparent}
        />
      ) : null}
    </>
  )

  return {
    MenuOverlay,
    handleOverflowClick,
    showOverflowMenu,
    setShowOverflowMenu,
  }
}
