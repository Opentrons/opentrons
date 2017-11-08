import React from 'react'
import PropTypes from 'prop-types'
import styles from './RunNotifications.css'

function ErrorNotification (props) {
  return (
    <div>
      {props.errors.map((e) =>
        <div key={e} className={styles.notification_wrapper}>
          <div className={styles.notification_icon}>X</div>
          <div className={styles.notification_message}>
            <span className={styles.type}>Error: </span>
            {e}
          </div>
        </div>
      )}
    </div>
  )
}

// function RunningNotification (props) {
//   return (
//     <div className={styles.tip_wrapper}>
//       <div className={styles.tip}>Tip</div>
//       <div className={styles.tip_text}>Your protocol is now running. You may unplug your computer from the robot and reconnect later without affecting the job.</div>
//     </div>
//   )
// }

function PausedNotification (props) {
  return (
    <div className={styles.notification_wrapper}>
      <div className={styles.notification_icon}>II</div>
      <div className={styles.notification_message}>
        <span className={styles.type}>PAUSED</span>
      </div>
    </div>
  )
}

export default function RunNotifications (props) {
  const {
    // isRunning,
    isPaused,
    errors,
    hasError
  } = props
  let notification = null

  if (hasError) {
    notification = <ErrorNotification {...{errors}} />
  } else if (isPaused) {
    notification = <PausedNotification />
  // } else if (isRunning) {
  //   notification = <RunningNotification />
  } else {
    notification = <div className={styles.no_notification} />
  }

  return notification
}

RunNotifications.propTypes = {
  isRunning: PropTypes.bool.isRequired,
  isPaused: PropTypes.bool.isRequired,
  hasError: PropTypes.bool.isRequired,
  errors: PropTypes.array
}
