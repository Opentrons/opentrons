/* eslint-disable react/forbid-dom-props */
import { useCallback, useRef, useState } from 'react'

import styles from './timelinescrubber.module.css'

import type { MouseEvent, ReactNode } from 'react'

export interface TrackData {
  id: string // unique id
  value: number // 0-100%
}

interface TrackSliderProps {
  track: TrackData
  onChange: (id: string, newValue: number) => void
}

export function TrackSlider({ track, onChange }: TrackSliderProps): ReactNode {
  const trackRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const THUMB_RADIUS_PX = 6

  const calculateValue = useCallback(
    (clientX: number) => {
      if (trackRef.current == null) return 0

      const rect = trackRef.current.getBoundingClientRect()
      const x = clientX - rect.x - THUMB_RADIUS_PX
      const width = rect.width - THUMB_RADIUS_PX * 2
      const clampedX = Math.min(width, Math.max(0, x))
      const value = width > 0 ? (clampedX / width) * 100 : 0

      return value
    },
    [THUMB_RADIUS_PX]
  )

  const handleMouseMove = useCallback(
    (e: globalThis.MouseEvent) => {
      const currentValue = calculateValue(e.clientX)
      onChange(track.id, currentValue)
    },
    [calculateValue, onChange, track.id]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)

    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseMove])

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>): void => {
    setIsDragging(true)
    const currentValue = calculateValue(e.clientX)
    onChange(track.id, currentValue)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div
      ref={trackRef}
      className={`${styles.track_container} ${
        isDragging ? styles.dragging : ''
      }`}
      onMouseDown={handleMouseDown}
    >
      <div className={styles.track_background} />
      <div
        className={styles.track_progress}
        style={{ width: `${track.value}%` }}
      />
      <div
        className={styles.track_thumb}
        style={{
          left: `calc(${THUMB_RADIUS_PX}px + (${track.value} / 100) * (100% - ${
            THUMB_RADIUS_PX * 2
          }px))`,
        }}
      />
    </div>
  )
}
