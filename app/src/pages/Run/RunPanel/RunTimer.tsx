import * as React from 'react'

import styles from './styles.css'

export interface RunTimerProps {
  startTime: string | null
  runTime: string
  // ce-added: will be adding pauseTime
  pauseTime: string
}

export function RunTimer(props: RunTimerProps): JSX.Element {
  const { startTime, runTime, pauseTime } = props
  const startTimeStamp = startTime ?? ''

  return (
    <div>
      <div className={styles.pause_time}>
        <p>Paused For: </p>
        {pauseTime}
      </div>
      <div className={styles.run_time}>
        <p>Total Runtime: </p>
        {runTime}
      </div>
      <div className={styles.start_time}>Start Time: {startTimeStamp}</div>
    </div>
  )
}
