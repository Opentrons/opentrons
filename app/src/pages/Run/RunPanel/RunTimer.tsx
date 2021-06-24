import * as React from 'react'
import { useSelector } from 'react-redux'
import { useInterval } from '@opentrons/components'

import { State } from '../../../redux/types'
import styles from './styles.css'
import {
  getIsPaused,
  getPausedSeconds,
  getRunSeconds,
  getStartTimeMs,
} from '../../../redux/robot/selectors'
import { formatSeconds, formatTime } from './utils'

export function RunTimer(): JSX.Element {
  const [now, setNow] = React.useState(Date.now())
  const startTimeMs = useSelector(getStartTimeMs)
  const runSeconds = useSelector((state: State): number =>
    getRunSeconds(state, now)
  )
  const pausedSeconds = useSelector((state: State): number =>
    getPausedSeconds(state, now)
  )
  const isPaused = useSelector(getIsPaused)

  /**
   * Using a a timer to update the run time and pause durations.
   */
  useInterval(() => setNow(Date.now()), 500)
  const runTime = formatSeconds(runSeconds)
  const startTime = formatTime(startTimeMs)

  // TODO(CE) See styling suggestions: https://github.com/Opentrons/opentrons/pull/7885#discussion_r647334710
  const renderPaused = (): JSX.Element => {
    const pausedTime = formatSeconds(pausedSeconds)
    return (
      <div className={styles.panel}>
        <div className={styles.bold_heading}>
          <p>Paused For: </p>
          {pausedTime}
        </div>
        <div className={styles.subheading}>Total Runtime: {runTime}</div>
        <div className={styles.subheading}>Start Time: {startTime}</div>
      </div>
    )
  }
  const renderNonPaused = (): JSX.Element => {
    return (
      <div>
        <div className={styles.bold_heading}>
          <p>Total Runtime: </p>
          {runTime}
        </div>
        <div className={styles.subheading}>Start Time: {startTime}</div>
      </div>
    )
  }

  return isPaused ? renderPaused() : renderNonPaused()
}
