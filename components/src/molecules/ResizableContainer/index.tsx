import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'

import styles from './resizablecontainer.module.css'

import type { CSSProperties, PointerEvent, ReactNode } from 'react'

export interface ResizableContainerProps {
  // contesnt
  children: ReactNode
  // aria-label for a container
  'aria-label': string
  // minimum width of the contaienr
  minWidth: number
  // maximum width of the contaienr
  maxWidth: number
  // container's draggable edge
  edge: 'left' | 'right'
  // the default width of the container
  defaultWidth?: number
}

export const ResizableContainer: React.FC<ResizableContainerProps> = (
  props: ResizableContainerProps
) => {
  const {
    children,
    'aria-label': ariaLabel,
    minWidth = 300,
    maxWidth,
    edge,
    defaultWidth,
  } = props
  const [width, setWidth] = useState<number | null>(defaultWidth ?? null)
  const [isResizing, setIsResizing] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef<number>(0)
  const startWidthRef = useRef<number>(0)

  useEffect(() => {
    if (defaultWidth === undefined && containerRef.current) {
      setWidth(containerRef.current.getBoundingClientRect().width)
    }
  }, [defaultWidth])

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return

    const handleElement = e.currentTarget
    handleElement.setPointerCapture(e.pointerId)

    setIsResizing(true)
    startXRef.current = e.clientX
    startWidthRef.current = containerRef.current.getBoundingClientRect().width

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizing) return

    const deltaX = e.clientX - startXRef.current

    const directionMultiplier = edge === 'right' ? 1 : -1
    const nextWidth = startWidthRef.current + deltaX * directionMultiplier

    const clampedWidth = Math.max(minWidth, Math.min(maxWidth, nextWidth))
    setWidth(clampedWidth)
  }

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>): void => {
    if (!isResizing) return

    e.currentTarget.releasePointerCapture(e.pointerId)

    setIsResizing(false)

    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  const style: CSSProperties = width !== null ? { width: `${width}px` } : {}

  return (
    <div ref={containerRef} className={styles.container} style={style}>
      {children}

      {/* handle part */}
      <div
        role="separator"
        aria-label={ariaLabel}
        aria-orientation="vertical"
        aria-valuenow={width ?? undefined}
        aria-valuemin={minWidth}
        aria-valuemax={maxWidth}
        className={clsx(
          styles.handle,
          styles[edge],
          isResizing && styles.resizing
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
    </div>
  )
}
