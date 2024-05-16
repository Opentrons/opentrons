import * as React from 'react'

import type { DragRect, GenericRect } from './types'

interface SelectionRectProps {
  onSelectionMove?: (rect: GenericRect) => void
  onSelectionDone?: (rect: GenericRect) => void
  children?: React.ReactNode
}

export function SelectionRect(props: SelectionRectProps): JSX.Element {
  const { onSelectionMove, onSelectionDone, children } = props

  const [positions, setPositions] = React.useState<DragRect | null>(null)
  const parentRef = React.useRef<HTMLElement | SVGElement | null>(null)

  const getRect = (args: DragRect): GenericRect => {
    const { xStart, yStart, xDynamic, yDynamic } = args
    return {
      x0: Math.min(xStart, xDynamic),
      x1: Math.max(xStart, xDynamic),
      y0: Math.min(yStart, yDynamic),
      y1: Math.max(yStart, yDynamic),
    }
  }

  const handleDrag = (e: TouchEvent): void => {
    const touch = e.touches[0]
    setPositions(prevPositions => {
      if (prevPositions) {
        const nextRect = {
          ...prevPositions,
          xDynamic: touch.clientX,
          yDynamic: touch.clientY,
        }
        const rect = getRect(nextRect)
        onSelectionMove && onSelectionMove(rect)

        return nextRect
      }
      return prevPositions
    })
  }

  const handleTouchEnd = (e: TouchEvent): void => {
    if (!(e instanceof TouchEvent)) {
      return
    }
    const finalRect = positions && getRect(positions)
    setPositions(prevPositions => {
      return prevPositions === positions ? null : prevPositions
    })
    // call onSelectionDone callback with {x0, x1, y0, y1} of final selection rectangle
    onSelectionDone && finalRect && onSelectionDone(finalRect)
  }

  const handleTouchStart: React.TouchEventHandler = e => {
    const touch = e.touches[0]
    setPositions({
      xStart: touch.clientX,
      xDynamic: touch.clientX,
      yStart: touch.clientY,
      yDynamic: touch.clientY,
    })
  }

  React.useEffect(() => {
    document.addEventListener('touchmove', handleDrag)
    document.addEventListener('touchend', handleTouchEnd)
    return () => {
      document.removeEventListener('touchmove', handleDrag)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleDrag, handleTouchEnd])

  return (
    <div
      // add mouse event for local development
      onTouchStart={handleTouchStart}
      ref={ref => {
        parentRef.current = ref
      }}
      // don't hard-code this width
      style={{ width: '600px' }}
    >
      {children}
    </div>
  )
}
