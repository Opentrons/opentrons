import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import moment from 'moment'
import RunNotifications from './RunNotifications'
import RunProgress from './RunProgress'
import styles from './RunControl.css'

export default function RunControl (props) {
  const {
    isReadyToRun,
    isPaused,
    isRunning,
    errors,
    sessionName,
    startTime,
    runTime,
    runProgress,
    onRunClick,
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

  let runButton
  let pauseResumeButton
  let cancelButton
  if (!isRunning) {
    runButton = (
      <button
        onClick={onRunClick}
        className={classnames('btn', 'btn_light', styles.btn_run)}
        disabled={!isReadyToRun}
      >
        Run Job
      </button>
    )
  } else {
    pauseResumeButton = (
      <button
        onClick={onPauseResumeClick}
        className={classnames('btn', 'btn_light', styles.btn_pause)}
        disabled={!isRunning}
      >
        {pauseResumeText}
      </button>
    )
    cancelButton =
      <button
        onClick={onCancelClick}
        className={classnames('btn', 'btn_light', styles.btn_cancel)}
        disabled={!isRunning}
      >
        Cancel Job
      </button>
  }

  let startTimeStamp
  if (startTime) {
    startTimeStamp = `Start Time: ${moment(startTime).format('hh:mm:ss a')}`
  }
  return (
    <span>
      <div className={styles.btn_wrapper}>
        <div className={styles.file_info}>
          {sessionName}
        </div>
        {runButton}
        {pauseResumeButton}
        {cancelButton}
      </div>

      <section className={styles.controls}>
        <div className={styles.timer}>
          <div className={styles.start_time}>{startTimeStamp}</div>
          <div className={styles.time_elapsed}>{runTime}</div>
        </div>
        <div className={styles.notifications}>
          <RunNotifications {...{isRunning, isPaused, errors, hasError}} />
        </div>
        <RunProgress style={styles.progress} {...{runProgress, isPaused, hasError}} />
      </section>
    </span>
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
