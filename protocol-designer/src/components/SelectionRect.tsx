import * as React from 'react'
import throttle from 'lodash/throttle'
import styles from './SelectionRect.css'
import { DragRect, GenericRect } from '../collision-types'

interface Props {
  onSelectionMove?: (e: MouseEvent, arg: GenericRect) => void
  onSelectionDone?: (e: MouseEvent, arg: GenericRect) => void
  svg?: boolean // set true if this is an embedded SVG
  children?: React.ReactNode
  originXOffset?: number
  originYOffset?: number
}

export const SelectionRect = (props: Props): JSX.Element => {
  const {
    onSelectionMove,
    onSelectionDone,
    svg,
    children,
    originXOffset = 0,
    originYOffset = 0,
  } = props
  const [positions, setPositions] = React.useState<DragRect | null>(null)
  const parentRef = React.useRef<HTMLElement | SVGElement | null>(null)
  const renderRect = (args: DragRect): React.ReactNode => {
    const { xStart, yStart, xDynamic, yDynamic } = args
    const left = Math.min(xStart, xDynamic)
    const top = Math.min(yStart, yDynamic)
    const width = Math.abs(xDynamic - xStart)
    const height = Math.abs(yDynamic - yStart)

    if (svg) {
      if (!parentRef.current) {
        return null
      }

      const clientRect: DOMRect = parentRef.current.getBoundingClientRect()
      const viewBox: {
        width: number
        height: number
      } = parentRef.current.closest('svg')?.viewBox?.baseVal ?? {
        width: 0,
        height: 0,
      }
      const xScale = viewBox.width / clientRect.width
      const yScale = viewBox.height / clientRect.height

      return (
        <rect
          x={(left - clientRect.left) * xScale - originXOffset}
          y={(top - clientRect.top) * yScale - originYOffset}
          width={width * xScale}
          height={height * yScale}
          className={styles.selection_rect}
        />
      )
    }

    return (
      <div
        className={styles.selection_rect}
        style={{
          left: left + 'px',
          top: top + 'px',
          width: width + 'px',
          height: height + 'px',
        }}
      />
    )
  }

  const getRect = (args: DragRect): GenericRect => {
    const { xStart, yStart, xDynamic, yDynamic } = args
    return {
      x0: Math.min(xStart, xDynamic),
      x1: Math.max(xStart, xDynamic),
      y0: Math.min(yStart, yDynamic),
      y1: Math.max(yStart, yDynamic),
    }
  }

  const handleMouseDown: React.MouseEventHandler = e => {
    e.preventDefault()
    document.addEventListener('mousemove', handleDragThrottled)
    document.addEventListener('mouseup', handleMouseUp)
    setPositions({
      xStart: e.clientX,
      xDynamic: e.clientX,
      yStart: e.clientY,
      yDynamic: e.clientY,
    })
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

  //  ensure handleDrag is only fired once every ms using throttle fn
  //  provides smoother experience and less lagginess when dragging
  //  to select wells
  const handleDragThrottled = throttle(handleDrag, 16)

  const handleMouseUp = (e: MouseEvent): void => {
    if (!(e instanceof MouseEvent)) {
      return
    }
    document.removeEventListener('mousemove', handleDragThrottled)
    document.removeEventListener('mouseup', handleMouseUp)

    const finalRect = positions && getRect(positions)
    setPositions(prevPositions => {
      return prevPositions === positions ? null : prevPositions
    })

    // call onSelectionDone callback with {x0, x1, y0, y1} of final selection rectangle
    onSelectionDone && finalRect && onSelectionDone(e, finalRect)
  }

  React.useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleDragThrottled)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])
  return svg ? (
    <g
      onMouseDown={handleMouseDown}
      ref={ref => {
        parentRef.current = ref
      }}
    >
      {children}
      {positions && renderRect(positions)}
    </g>
  ) : (
    <div
      onMouseDown={handleMouseDown}
      ref={ref => {
        parentRef.current = ref
      }}
    >
      {positions && renderRect(positions)}
      {children}
    </div>
  )
}
