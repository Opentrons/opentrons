import { useEffect, useState } from 'react'

import {
  useCurrentRunStatus,
  useRunControls,
} from '/app/organisms/RunTimeControl'
import { useCurrentRunId } from '/app/resources/runs'

import styles from './holiday.module.css'
import { Snowflakes } from './Snowflakes'

import type { ReactNode } from 'react'

export function Instructions({
  setGamePhase,
}: {
  setGamePhase: (phase: GamePhase) => void
}): ReactNode {
  const [countdown, setCountdown] = useState<string>()
  const runId = useCurrentRunId()
  const { play } = useRunControls(runId)
  const isPaused = useCurrentRunStatus() === 'paused'

  useEffect(() => {
    if (!isPaused) return
    const interval = setInterval(() => {
      setCountdown((prev: string | undefined) => {
        if (!prev) return 'Ready...'
        if (prev === 'Ready...') {
          return 'Set...'
        }
        if (prev === 'Set...') {
          return 'Go!'
        }
        play()
        setGamePhase('playing')
        return prev
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [isPaused])

  return (
    <div className={styles.background}>
      <p className={styles.instructions}>
        Use the joystick to move the gripper! Press the button to grab your
        prize! You have 60 seconds!
      </p>
      <h2 className={styles.instructions_countdown}>{countdown}</h2>
      <Snowflakes count={100} />
    </div>
  )
}
