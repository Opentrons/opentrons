// @flow
import * as React from 'react'

import styles from './styles.css'

export type RunTimerProps = {|
  startTime: string | null,
  runTime: string,
|}

export function RunTimer(props: RunTimerProps) {
  const { startTime, runTime } = props
  const startTimeStamp = startTime ?? ''

  return (
    <div>
      <div className={styles.run_time}>
        <p>Run Time: </p>
        {runTime}
      </div>
      <div className={styles.start_time}>Start Time: {startTimeStamp}</div>
    </div>
  )
}
