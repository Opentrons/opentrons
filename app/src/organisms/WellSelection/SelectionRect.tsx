import * as React from 'react'

import type { DragRect, GenericRect } from './types'

interface SelectionRectProps {
  onSelectionMove?: (e: MouseEvent, arg: GenericRect) => void
  onSelectionDone?: (e: MouseEvent, arg: GenericRect) => void
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

  const handleDrag = (e: MouseEvent): void => {
    setPositions(prevPositions => {
      if (prevPositions) {
        const nextRect = {
          ...prevPositions,
          xDynamic: e.clientX,
          yDynamic: e.clientY,
        }
        const rect = getRect(nextRect)
        onSelectionMove && onSelectionMove(e, rect)

        return nextRect
      }
      return prevPositions
    })
  }

  const handleMouseUp = (e: MouseEvent): void => {
    if (!(e instanceof MouseEvent)) {
      return
    }
    const finalRect = positions && getRect(positions)
    setPositions(prevPositions => {
      return prevPositions === positions ? null : prevPositions
    })
    // call onSelectionDone callback with {x0, x1, y0, y1} of final selection rectangle
    onSelectionDone && finalRect && onSelectionDone(e, finalRect)
  }

  const handleMouseDown: React.MouseEventHandler = e => {
    setPositions({
      xStart: e.clientX,
      xDynamic: e.clientX,
      yStart: e.clientY,
      yDynamic: e.clientY,
    })
  }

  React.useEffect(() => {
    document.addEventListener('mousemove', handleDrag)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleDrag)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleDrag, handleMouseUp])

  return (
    <div
      onMouseDown={handleMouseDown}
      ref={ref => {
        parentRef.current = ref
      }}
      style={{ width: '600px' }}
    >
      {children}
    </div>
  )
}
