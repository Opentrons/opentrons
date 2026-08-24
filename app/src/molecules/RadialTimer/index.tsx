import { useEffect, useMemo, useState } from 'react'

import { StyledText } from '@opentrons/components'

import styles from './radial_timer.module.css'

import type { ReactNode } from 'react'

interface RadialTimerProps {
  from: number
  until: number
}

const RADIUS = 18
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function getTimerValue(until: number): number {
  const r = until - Date.now()
  return Math.max(0, Math.ceil(r / 1000))
}

export function RadialTimer({ from, until }: RadialTimerProps): ReactNode {
  const [value, setValue] = useState(() => getTimerValue(until))

  useEffect(() => {
    setValue(getTimerValue(until))
    const interval = setInterval(() => {
      setValue(getTimerValue(until))
    }, 1000)
    return () => {
      clearInterval(interval)
    }
  }, [until])

  // Animation may launch partway through the timer
  const { remainingMs, offsetStart } = useMemo(() => {
    const totalMs = until - from
    const remaining = Math.max(0, until - Date.now())
    const remainingFraction = totalMs > 0 ? remaining / totalMs : 0
    return {
      remainingMs: remaining,
      offsetStart: CIRCUMFERENCE * (1 - remainingFraction),
    }
  }, [from, until])

  const progressStyle: React.CSSProperties & Record<string, string | number> = {
    '--ring-offset-start': offsetStart,
    '--ring-circumference': CIRCUMFERENCE,
    '--animation-duration': `${remainingMs}ms`,
  }

  return (
    <div className={styles.radial_timer_container}>
      <StyledText
        oddStyle="smallBodyTextSemiBold"
        className={styles.radial_timer_value}
      >{`${value}`}</StyledText>
      <svg
        key={`${from}-${until}`}
        viewBox="0 0 40 40"
        className={styles.radial_timer_svg}
        aria-hidden
      >
        <g transform="translate(20 20) rotate(90) scale(-1, 1) translate(-20 -20)">
          <circle
            cx="20"
            cy="20"
            r={RADIUS}
            className={styles.radial_timer_track}
          />
          <circle
            cx="20"
            cy="20"
            r={RADIUS}
            className={styles.radial_timer_progress}
            style={progressStyle}
          />
        </g>
      </svg>
    </div>
  )
}
