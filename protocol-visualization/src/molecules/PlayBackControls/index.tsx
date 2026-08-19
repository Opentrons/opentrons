import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Icon,
  NewIconButton,
  StyledText,
  TimelineScrubber,
} from '@opentrons/components'

import { PerStepOverflowMenu } from '../PerStepOverflowMenu'
import styles from './playbackcontrols.module.css'
import { getSpeedMultiplierText } from './utils/getSpeedMultiplierText'
import { isEditableKeyboardTarget } from './utils/isEditableKeyboardTarget'

import type {
  Dispatch,
  ReactNode,
  PointerEvent as ReactPointerEvent,
  SetStateAction,
} from 'react'
import type { RunTimeCommand } from '@opentrons/shared-data'

interface PlayBackControlsProps {
  isPlaying: boolean
  handlePlayPause: () => void
  currentCommandIndex: number
  numCommandLength: number
  commands: RunTimeCommand[]
  setSelectedCommand: Dispatch<SetStateAction<string | null>>
  milliSecondsPerFrame: number
  setMilliSecondsPerFrame: Dispatch<SetStateAction<number>>
  showStepDetail: boolean
  onClickStepDetail: Dispatch<SetStateAction<boolean>>
}

export function PlayBackControls(props: PlayBackControlsProps): ReactNode {
  const {
    isPlaying,
    handlePlayPause,
    currentCommandIndex,
    numCommandLength,
    commands,
    setSelectedCommand,
    milliSecondsPerFrame,
    setMilliSecondsPerFrame,
    showStepDetail,
    onClickStepDetail,
  } = props

  const { t } = useTranslation('protocol_visualization')
  const [showPerStepOverflowMenu, setShowPerStepOverflowMenu] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    pointerId: number
    startPointer: { x: number; y: number }
    startPosition: { x: number; y: number }
    startRect: DOMRect
  } | null>(null)

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>
  ): void => {
    const target = event.target as HTMLElement
    const interactiveTarget = target.closest(
      'button, input, [role="slider"], [role="menu"], [data-playback-slider]'
    )
    if (interactiveTarget != null) {
      return
    }

    const container = containerRef.current
    if (container == null) {
      return
    }

    dragRef.current = {
      pointerId: event.pointerId,
      startPointer: { x: event.clientX, y: event.clientY },
      startPosition: position,
      startRect: container.getBoundingClientRect(),
    }
    container.setPointerCapture(event.pointerId)
    setIsDragging(true)
  }

  const handlePointerMove = (
    event: ReactPointerEvent<HTMLDivElement>
  ): void => {
    const drag = dragRef.current
    if (drag == null || drag.pointerId !== event.pointerId) {
      return
    }

    const margin = 8
    const deltaX = event.clientX - drag.startPointer.x
    const deltaY = event.clientY - drag.startPointer.y
    const maxLeft = Math.max(
      margin,
      window.innerWidth - margin - drag.startRect.width
    )
    const maxTop = Math.max(
      margin,
      window.innerHeight - margin - drag.startRect.height
    )
    const left = Math.min(
      Math.max(drag.startRect.left + deltaX, margin),
      maxLeft
    )
    const top = Math.min(Math.max(drag.startRect.top + deltaY, margin), maxTop)

    setPosition({
      x: drag.startPosition.x + left - drag.startRect.left,
      y: drag.startPosition.y + top - drag.startRect.top,
    })
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (dragRef.current?.pointerId !== event.pointerId) {
      return
    }

    dragRef.current = null
    setIsDragging(false)
    const container = containerRef.current
    if (container?.hasPointerCapture(event.pointerId) === true) {
      container.releasePointerCapture(event.pointerId)
    }
  }

  useEffect(() => {
    const container = containerRef.current
    if (container == null) {
      return
    }

    container.style.setProperty('--drag-x', `${position.x}px`)
    container.style.setProperty('--drag-y', `${position.y}px`)
  }, [position])

  useEffect(() => {
    const handleResize = (): void => {
      const container = containerRef.current
      if (container == null) {
        return
      }

      const rect = container.getBoundingClientRect()
      const margin = 8
      const xAdjustment = Math.min(
        Math.max(margin - rect.left, 0),
        Math.max(window.innerWidth - margin - rect.right, 0)
      )
      const yAdjustment = Math.min(
        Math.max(margin - rect.top, 0),
        Math.max(window.innerHeight - margin - rect.bottom, 0)
      )

      if (xAdjustment !== 0 || yAdjustment !== 0) {
        setPosition(prev => ({
          x: prev.x + xAdjustment,
          y: prev.y + yAdjustment,
        }))
      }
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const handlePerStepOverflowClick = (): void => {
    setShowPerStepOverflowMenu(prev => !prev)
  }

  const handleTrackChange = (updatedTrack: {
    id: string
    value: number
  }): void => {
    if (numCommandLength <= 1) {
      return
    }

    const normalizedValue = updatedTrack.value / 100
    const nextIndex = Math.min(
      Math.max(Math.round(normalizedValue * (numCommandLength - 1)), 0),
      numCommandLength - 1
    )

    const nextCommandId = commands[nextIndex]?.id
    if (nextCommandId != null) {
      setSelectedCommand(nextCommandId)
    }
  }

  const currentProgress =
    numCommandLength > 1
      ? (currentCommandIndex / (numCommandLength - 1)) * 100
      : 0
  const tracks = [
    {
      id: 'protocol-timeline',
      value: currentProgress,
    },
  ]

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== ' ') {
        return
      }

      if (isEditableKeyboardTarget(event.target)) {
        return
      }

      event.preventDefault()
      handlePlayPause()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handlePlayPause])

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${isDragging ? styles.dragging : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className={styles.controls_left}>
        {/* play/pause button */}
        <NewIconButton
          variant="primary"
          iconName={isPlaying ? 'pause' : 'play'}
          onClick={handlePlayPause}
          aria-label={isPlaying ? t('pause') : t('play')}
        />

        {/* time slider */}
        <div className={styles.slider_wrapper} data-playback-slider>
          <TimelineScrubber tracks={tracks} onTrackChange={handleTrackChange} />
        </div>

        {/* speed switch */}
        <div className={styles.speed_wrapper}>
          <button
            type="button"
            className={styles.speed_button}
            onClick={handlePerStepOverflowClick}
          >
            <StyledText desktopStyle="captionSemiBold">
              {getSpeedMultiplierText(milliSecondsPerFrame)}
            </StyledText>
          </button>

          {showPerStepOverflowMenu && (
            <PerStepOverflowMenu
              setShowPerStepOverflowMenu={setShowPerStepOverflowMenu}
              setMilliSecondsPerFrame={setMilliSecondsPerFrame}
            />
          )}
        </div>
      </div>
      {/* divider */}
      <div className={styles.divider} />
      {/* right edge */}
      <div className={styles.controls_right}>
        <button
          type="button"
          onClick={() => {
            onClickStepDetail(!showStepDetail)
          }}
          className={styles.icon_button}
          aria-label={t('step_details')}
        >
          <Icon name="step-detail" size="1rem" />
        </button>
      </div>
    </div>
  )
}
