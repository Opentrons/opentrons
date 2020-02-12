// @flow
import * as React from 'react'
import moment from 'moment'

import styles from './styles.css'

export type RunTimerProps = {|
  startTime: ?number,
  runTime: string,
|}

export function RunTimer(props: RunTimerProps) {
  const { startTime, runTime } = props
  let startTimeStamp
  if (typeof startTime === 'number') {
    startTimeStamp = `${moment(startTime).format('hh:mm:ss a')}`
  }
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
