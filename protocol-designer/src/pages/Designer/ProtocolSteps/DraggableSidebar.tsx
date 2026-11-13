import { useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
} from '@opentrons/components'

import { TimelineToolbox } from './Timeline/TimelineToolbox'

import type { Dispatch, ReactNode, SetStateAction } from 'react'

const INITIAL_SIDEBAR_WIDTH = 235
const MIN_SIDEBAR_WIDTH = 170
const MAX_SIDEBAR_WIDTH = 350

interface DraggableSidebarProps {
  setTargetWidth: (width: number) => void
  showLiquidOverflowMenu: Dispatch<SetStateAction<boolean>>
}

// Note (kk:2024/12/20 the designer will revisit responsive sidebar design in 2025
// we will need to update the details to align with the updated design
export function DraggableSidebar({
  setTargetWidth,
  showLiquidOverflowMenu,
}: DraggableSidebarProps): ReactNode {
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState<number>(
    INITIAL_SIDEBAR_WIDTH
  )

  const startResizing = useCallback(() => {
    setIsResizing(true)
  }, [])

  const stopResizing = useCallback(() => {
    setIsResizing(false)
  }, [])

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing && sidebarRef.current != null) {
        const newWidth =
          mouseMoveEvent.clientX -
          sidebarRef.current.getBoundingClientRect().left

        if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= MAX_SIDEBAR_WIDTH) {
          setSidebarWidth(newWidth)
          setTargetWidth(newWidth)
        }
      }
    },
    [isResizing, setTargetWidth]
  )

  useEffect(() => {
    window.addEventListener('mousemove', resize)
    window.addEventListener('mouseup', stopResizing)

    return () => {
      window.removeEventListener('mousemove', resize)
      window.removeEventListener('mouseup', stopResizing)
    }
  }, [resize, stopResizing])

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      height="100%"
    >
      <SidebarContainer ref={sidebarRef}>
        <SidebarContent>
          <TimelineToolbox
            sidebarWidth={sidebarWidth}
            showLiquidOverflowMenu={showLiquidOverflowMenu}
          />
        </SidebarContent>
        <SidebarResizer dragging={isResizing} onMouseDown={startResizing} />
      </SidebarContainer>
    </Flex>
  )
}

const SidebarContainer = styled(Flex)`
  flex-direction: ${DIRECTION_COLUMN};
  border-right: 1px solid #ccc;
  position: relative;
  /* overflow: hidden; */
  height: 100%;
`

const SidebarContent = styled(Flex)`
  flex: 1;
`

interface SidebarResizerProps {
  dragging: boolean
}

const SidebarResizer = styled(Flex)<SidebarResizerProps>`
  user-select: none;
  width: 2px;
  cursor: ew-resize;
  background-color: #ddd;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  margin: 0;
  padding: 0;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${COLORS.blue50}; /* Hover state */
  }

  ${props =>
    props.dragging &&
    `
    background-color: ${COLORS.blue55}; /* Dragging state */
  `}
`
