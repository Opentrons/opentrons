import React from 'react'
import PropTypes from 'prop-types'
import RunNotifications from './RunNotifications'
import RunProgress from './RunProgress'

import grid from './Grid.css'
import styles from './RunControl.css'

export default function RunControl (props) {
  const {
    isRunning,
    isPaused,
    errors,
    sessionName,
    startTime,
    runTime,
    runProgress,
    onPauseClick,
    onResumeClick,
    onCancelClick
  } = props

  const hasError = errors.length > 0
  const onPauseResumeClick = isPaused
    ? onResumeClick
    : onPauseClick

  const pauseResumeText = isPaused
    ? 'Resume'
    : 'Pause'

  const pauseResumeButton = (
    <button
      onClick={onPauseResumeClick}
      className={styles.btn_pause}
      disabled={!isRunning}
    >
      {pauseResumeText}
    </button>
  )

  return (
    <section className={grid.controls}>
      <div className={styles.btn_wrapper}>
        <div className={styles.file_info}>
          FILE NAME: {sessionName}
          <br />
          START TIME: {startTime}
        </div>
        {pauseResumeButton}
        <button
          onClick={onCancelClick}
          className={styles.btn_cancel}
          disabled={!isRunning}
        >
          Cancel Job
        </button>
      </div>
      <div className={styles.notifications}>
        <RunNotifications {...{isRunning, isPaused, errors, hasError}} />
      </div>

      <div className={styles.progress} >
        { hasError && <button className={styles.btn_error}>Report Error</button> }
        <div className={styles.timer}>
          {runTime}
        </div>
        <RunProgress style={styles.progress_bar} {...{runProgress, isPaused, hasError}} />
      </div>

    </section>
  )
}

RunControl.propTypes = {
  sessionName: PropTypes.string.isRequired,
  startTime: PropTypes.string.isRequired,
  runTime: PropTypes.string.isRequired,
  isRunning: PropTypes.bool.isRequired,
  isPaused: PropTypes.bool.isRequired,
  onPauseClick: PropTypes.func.isRequired,
  onResumeClick: PropTypes.func.isRequired,
  onCancelClick: PropTypes.func.isRequired,
  errors: PropTypes.array,
  style: PropTypes.string
}
