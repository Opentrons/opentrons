import React from 'react'
import PropTypes from 'prop-types'
import styles from './RunControl.css'
import RunNotifications from './RunNotifications'
import RunProgress from './RunProgress'

export default function RunControl (props) {
  const {
    isRunning,
    isPaused,
    errors,
    style,
    protocolName,
    startTime,
    runProgress,
    onPauseClick,
    onResumeClick,
    onCancelClick
  } = props

  const hasError = errors.length > 0

  const pauseResumeButton = isPaused
    ? (<button onClick={onResumeClick} className={styles.btn_pause}>Resume</button>)
    : (<button onClick={onPauseClick} className={styles.btn_pause}>Pause</button>)

  return (
    <section className={style}>
      <div className={styles.btn_wrapper}>
        <div className={styles.file_info}>
          FILE NAME: {protocolName}
          <br />
          START TIME: {startTime}
        </div>
        {pauseResumeButton}
        <button onClick={onCancelClick} className={styles.btn_cancel}>
          Cancel Job
        </button>
      </div>
      <div className={styles.notifications}>
        <RunNotifications {...{isRunning, isPaused, errors, hasError}} />
      </div>

      <div className={styles.progress} >
        { hasError && <button className={styles.btn_error}>Report Error</button> }
        <div className={styles.timer}>00:03:00</div>
        <RunProgress style={styles.progress_bar} {...{runProgress, isPaused, hasError}} />
      </div>

    </section>
  )
}

RunControl.propTypes = {
  protocolName: PropTypes.string.isRequired,
  isRunning: PropTypes.bool.isRequired,
  isPaused: PropTypes.bool.isRequired,
  onPauseClick: PropTypes.func.isRequired,
  onResumeClick: PropTypes.func.isRequired,
  onCancelClick: PropTypes.func.isRequired,
  errors: PropTypes.array,
  style: PropTypes.string
}
