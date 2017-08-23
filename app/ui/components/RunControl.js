import React from 'react'
import PropTypes from 'prop-types'
import styles from './RunControl.css'
import RunNotifications from './RunNotifications'
import RunProgress from './RunProgress'

export default function RunControl (props) {
  const {isRunning, isPaused, errors, style, fileName, startTime} = props
  const hasError = errors.length > 0
  const progress = (1 / 3) * 100 // dummy current index divded by commands.length for progress bar

  return (
    <section className={style}>
      <div className={styles.btn_wrapper}>
        <div className={styles.file_info}>
          FILE NAME: {fileName}
          <br />
          START TIME: {startTime}
        </div>
        { isPaused
          ? <button onClick={() => { console.log('resume') }} className={styles.btn_pause}>Resume</button>
          : <button onClick={() => { console.log('pause') }} className={styles.btn_pause}>Pause</button>
        }
        <button onClick={() => { console.log('cancel') }} className={styles.btn_cancel}>Cancel Job</button>
      </div>
      <div className={styles.notifications}>
        <RunNotifications {...{isRunning, isPaused, errors, hasError}} />
      </div>

      <div className={styles.progress} >
        { hasError && <button className={styles.btn_error}>Report Error</button> }
        <div className={styles.timer}>00:03:00</div>
        <RunProgress style={styles.progress_bar} {...{progress, isPaused, hasError}} />
      </div>

    </section>
  )
}

RunControl.propTypes = {
  isRunning: PropTypes.bool,
  isPaused: PropTypes.bool,
  errors: PropTypes.array,
  style: PropTypes.string
}
