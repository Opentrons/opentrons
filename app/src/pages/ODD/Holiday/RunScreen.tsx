import { useEffect, useState } from 'react'

import { useCurrentRunStatus } from '/app/organisms/RunTimeControl'

import styles from './holiday.module.css'
import { Instructions } from './Instructions'
import { Snowflakes } from './Snowflakes'
import { RadialTimer } from './Timer'

import type { ReactNode } from 'react'

function TimerScreen(): ReactNode {
  const [start, setStart] = useState(Date.now())

  return (
    <div className={styles.background}>
      <div className={styles.timer_container}>
        <RadialTimer from={start} until={start + 60000} />
      </div>
      <Snowflakes count={100} />
    </div>
  )
}

export function RunScreen(): ReactNode {
  const isPaused = useCurrentRunStatus() === 'paused'
  const [hasBeenPaused, setHasBeenPaused] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)

  useEffect(() => {
    if (isPaused) setHasBeenPaused(true)
    if (!isPaused && hasBeenPaused) setShowInstructions(false)
  }, [isPaused])

  if (showInstructions) return <Instructions />
  return <TimerScreen />
}
