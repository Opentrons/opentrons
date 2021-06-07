import * as React from 'react'
import { useSelector, useStore } from 'react-redux'
import padStart from 'lodash/padStart'
import { useInterval } from '@opentrons/components'
import styles from './styles.css'
import {
  getRunSeconds,
  getPausedSeconds,
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
  const state = useStore().getState()
  const startTimeMs = useSelector(getStartTimeMs)
  const runSeconds = getRunSeconds(state, now)
  const pausedSeconds = getPausedSeconds(state, now)

  /**
   * Using a a timer to tick at a 1 second interval to update the run time and pause durations.
   */
  useInterval(() => setNow(Date.now()), 1000)
  const pausedTime = formatSeconds(pausedSeconds)
  const runTime = formatSeconds(runSeconds)
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
