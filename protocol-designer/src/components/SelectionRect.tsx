import * as React from 'react'

import styles from './SelectionRect.css'
import type { DragRect, GenericRect } from '../collision-types'

interface Props {
  onSelectionMove?: (e: MouseEvent, arg: GenericRect) => void
  onSelectionDone?: (e: MouseEvent, arg: GenericRect) => void
  svg?: boolean // set true if this is an embedded SVG
  children?: React.ReactNode
  originXOffset?: number
  originYOffset?: number
}

export const SelectionRect = (props: Props): JSX.Element => {
  const parentRef = React.useRef<HTMLElement | SVGElement | null>(null)
  const {
    onSelectionMove,
    onSelectionDone,
    svg,
    children,
    originXOffset,
    originYOffset,
  } = props
  const [positions, setPositions] = React.useState<DragRect | null>(null)

  const renderRect = (args: DragRect): React.ReactNode => {
    const { xStart, yStart, xDynamic, yDynamic } = args
    const left = Math.min(xStart, xDynamic)
    const top = Math.min(yStart, yDynamic)
    const width = Math.abs(xDynamic - xStart)
    const height = Math.abs(yDynamic - yStart)
    if (svg) {
      // calculate ratio btw clientRect bounding box vs svg parent viewBox
      // WARNING: May not work right if you're nesting SVGs!
      if (!parentRef.current) {
        return null
      }

      const clientRect: {
        width: number
        height: number
        left: number
        top: number
      } = parentRef.current.getBoundingClientRect()
      // @ts-expect-error(sa, 2021-7-1): parentRef.closest might return null
      const viewBox: { width: number; height: number } = parentRef.closest(
        'svg'
      ).viewBox.baseVal // WARNING: elem.closest() is experiemental

      const xScale = viewBox.width / clientRect.width
      const yScale = viewBox.height / clientRect.height

      return (
        <rect
          x={(left - clientRect.left) * xScale - (originXOffset ?? 0)}
          y={(top - clientRect.top) * yScale - (originYOffset ?? 0)}
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
    // convert internal rect position to more generic form
    // TODO should this be used in renderRect?
    return {
      x0: Math.min(xStart, xDynamic),
      x1: Math.max(xStart, xDynamic),
      y0: Math.min(yStart, yDynamic),
      y1: Math.max(yStart, yDynamic),
    }
  }

  const handleMouseDown: React.MouseEventHandler<
    SVGGElement | HTMLElement
  > = e => {
    document.addEventListener('mousemove', handleDrag)
    document.addEventListener('mouseup', handleMouseUp)
    setPositions({
      xStart: e.clientX,
      xDynamic: e.clientX,
      yStart: e.clientY,
      yDynamic: e.clientY,
    })
  }

  const handleDrag: (e: MouseEvent) => void = e => {
    if (positions) {
      const nextRect = {
        ...positions,
        xDynamic: e.clientX,
        yDynamic: e.clientY,
      }

      setPositions(nextRect)

      const rect = getRect(nextRect)
      onSelectionMove != null && onSelectionMove(e, rect)
    }
  }

  const handleMouseUp: (e: MouseEvent) => void = e => {
    if (!(e instanceof MouseEvent)) {
      return
    }
    document.removeEventListener('mousemove', handleDrag)
    document.removeEventListener('mouseup', handleMouseUp)

    const finalRect = positions != null && getRect(positions)

    // clear the rectangle
    setPositions(null)

    // call onSelectionDone callback with {x0, x1, y0, y1} of final selection rectangle
    onSelectionDone != null && finalRect && onSelectionDone(e, finalRect)
  }

  return svg ? (
    <g
      onMouseDown={handleMouseDown}
      ref={ref => {
        if (ref) {
          parentRef.current = ref
        }
      }}
    >
      {children}
      {positions != null && renderRect(positions)}
    </g>
  ) : (
    <div
      onMouseDown={handleMouseDown}
      ref={ref => {
        if (ref) {
          parentRef.current = ref
        }
      }}
    >
      {positions && renderRect(positions)}
      {children}
    </div>
  )
}
