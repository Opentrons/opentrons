import * as React from 'react'
import { useSelector } from 'react-redux'
import padStart from 'lodash/padStart'

import styles from './styles.css'
import {
  getRunSecondsAt,
  getPausedSecondsAt,
  getStartTimeMs,
} from '../../../redux/robot/selectors'
import { format } from 'date-fns'

function formatSeconds(runSeconds: number): string {
  const hours = padStart(`${Math.floor(runSeconds / 3600)}`, 2, '0')
  const minutes = padStart(`${Math.floor(runSeconds / 60) % 60}`, 2, '0')
  const seconds = padStart(`${runSeconds % 60}`, 2, '0')
  return `${hours}:${minutes}:${seconds}`
}

export function RunTimer(): JSX.Element {
  const [now, setNow] = React.useState(Date.now())
  const startTimeMs = useSelector(getStartTimeMs)
  const getRunSeconds = useSelector(getRunSecondsAt)(now)
  const getPausedSeconds = useSelector(getPausedSecondsAt)(now)

  /**
   * Using a a timer to tick at a 1 second interval to update the run time and pause durations.
   */
  React.useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return clearInterval.bind(null, timer)
  })

  const pausedTime = formatSeconds(getPausedSeconds)
  const runTime = formatSeconds(getRunSeconds)
  const startTime = startTimeMs != null ? format(startTimeMs, 'pp') : ''

  return (
    <div>
      <div className={styles.pause_time}>
        <p>Paused For: </p>
        {pausedTime}
      </div>
      <div className={styles.run_time}>
        <p>Total Runtime: </p>
        {runTime}
      </div>
      <div className={styles.start_time}>Start Time: {startTime}</div>
    </div>
  )
}
