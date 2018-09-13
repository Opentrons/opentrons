// @flow
import * as React from 'react'
import moment from 'moment'

import styles from './styles.css'

type TimeProps = {
  startTime: ?number,
  runTime: string,
}

export default function RunTimer (props: TimeProps) {
  const {startTime, runTime} = props
  let startTimeStamp
  if (startTime) {
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
