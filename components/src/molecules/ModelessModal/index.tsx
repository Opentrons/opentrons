import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { Icon } from '../../icons'
import styles from './modelessmodal.module.css'

import type { KeyboardEvent, MouseEvent, ReactNode } from 'react'

const STEP_PX = 10 // move 10px when hitting an arrow key
const MIN_SIZE_PX = 300 // minimum modal size

interface ModelessModalProps {
  // header part
  header: ReactNode | string
  // modal content - all spacing should be handled by content itself
  children: ReactNode
  // modal title
  'aria-labelledby': string
  // function to close modal
  onClose: () => void
  // aria-label for close modal
  'aria-label': string
  // default width
  defaultWidth?: number
  // default height
  defaultHeight?: number
}

export function ModelessModal({
  header,
  children,
  'aria-labelledby': ariaLabelledby,
  onClose,
  'aria-label': ariaLabel,
  defaultWidth = 400,
  defaultHeight = 400,
}: ModelessModalProps): JSX.Element {
  const modalRef = useRef<HTMLDivElement>(null)

  const [rect, setRect] = useState({
    subLeft: 100,
    subTop: 100,
    width: defaultWidth,
    height: defaultHeight,
  })
  // to avoid memory leaking
  const dragCleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (modalRef.current != null) {
      modalRef.current.focus()

      const initialLeft = Math.max(0, (window.innerWidth - defaultWidth) / 2)
      const initialTop = Math.max(0, (window.innerHeight - defaultHeight) / 2)
      setRect(prev => ({
        ...prev,
        subLeft: initialLeft,
        subTop: initialTop,
      }))
    }
    return () => {
      if (dragCleanupRef.current != null) {
        dragCleanupRef.current()
      }
    }
  }, [defaultWidth, defaultHeight])

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
      return
    }

    const isHeaderFocused = (e.target as HTMLElement).closest(
      `.${styles.modal_header}`
    )
    if (isHeaderFocused == null) {
      return
    }

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault()

      setRect(prev => {
        let { subLeft, subTop, width, height } = prev

        if (e.shiftKey) {
          if (e.key === 'ArrowRight') width = width + STEP_PX
          if (e.key === 'ArrowDown') height = height + STEP_PX
          if (e.key === 'ArrowLeft') {
            width = width + STEP_PX
            subLeft = subLeft - STEP_PX
          }
          if (e.key === 'ArrowUp') {
            height = Math.max(MIN_SIZE_PX, height - STEP_PX)
          }
        } else {
          if (e.key === 'ArrowRight') subLeft += STEP_PX
          if (e.key === 'ArrowLeft') subLeft -= STEP_PX
          if (e.key === 'ArrowDown') subTop += STEP_PX
          if (e.key === 'ArrowUp') subTop = Math.max(0, subTop - STEP_PX)
        }

        return { subLeft, subTop, width, height }
      })
    }
  }

  const handleHeaderMouseDown = (e: MouseEvent): void => {
    if ((e.target as HTMLElement).closest('.close_button')) {
      return
    }

    const startX = e.clientX - rect.subLeft
    const startY = e.clientY - rect.subTop

    const handleMouseMove = (moveEvent: globalThis.MouseEvent): void => {
      setRect(prev => ({
        ...prev,
        subLeft: moveEvent.clientX - startX,
        subTop: Math.max(0, moveEvent.clientY - startY),
      }))
    }

    const handleMouseUp = (): void => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      dragCleanupRef.current = null
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    dragCleanupRef.current = () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }

  const handleResizeMouseDown = (
    direction: string,
    startE: MouseEvent
  ): void => {
    startE.preventDefault()
    startE.stopPropagation()

    const startWidth = rect.width
    const startHeight = rect.height
    const startX = startE.clientX
    const startY = startE.clientY

    const handleMouseMove = (moveEvent: globalThis.MouseEvent): void => {
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY

      setRect(prev => {
        let { subLeft, subTop, width, height } = prev

        if (direction.includes('r')) {
          width = Math.max(MIN_SIZE_PX, startWidth + deltaX)
        }

        if (direction.includes('b')) {
          height = Math.max(MIN_SIZE_PX, startHeight + deltaY)
        }

        if (direction.includes('l')) {
          const calculatedWidth = startWidth - deltaX
          if (calculatedWidth >= MIN_SIZE_PX) {
            width = calculatedWidth
            subLeft = rect.subLeft + deltaX
          }
        }

        return { subLeft, subTop, width, height }
      })
    }

    const handleMouseUp = (): void => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      dragCleanupRef.current = null
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    dragCleanupRef.current = () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }

  return createPortal(
    <div
      ref={modalRef}
      className={styles.modal_root}
      style={{
        left: `${rect.subLeft}px`,
        top: `${rect.subTop}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
      }}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="false"
      aria-labelledby={ariaLabelledby}
    >
      <div
        className={styles.modal_header}
        onMouseDown={handleHeaderMouseDown}
        tabIndex={0}
      >
        <div className={styles.header_title}>{header}</div>
        <button
          className={styles.close_button}
          onClick={onClose}
          aria-label={ariaLabel}
        >
          <Icon name="close" size="1.75rem" />
        </button>
      </div>

      <div className={styles.modal_content}>{children}</div>

      <div
        className={`${styles.resizer} ${styles.resizer_r}`}
        onMouseDown={e => {
          handleResizeMouseDown('r', e)
        }}
      />
      <div
        className={`${styles.resizer} ${styles.resizer_l}`}
        onMouseDown={e => {
          handleResizeMouseDown('l', e)
        }}
      />
      <div
        className={`${styles.resizer} ${styles.resizer_b}`}
        onMouseDown={e => {
          handleResizeMouseDown('b', e)
        }}
      />
      <div
        className={`${styles.resizer} ${styles.resizer_bl}`}
        onMouseDown={e => {
          handleResizeMouseDown('bl', e)
        }}
      />
      <div
        className={`${styles.resizer} ${styles.resizer_br}`}
        onMouseDown={e => {
          handleResizeMouseDown('br', e)
        }}
      />
    </div>,
    document.body
  )
}
