import React from 'react'
import styles from './RunNotifications.css'

const ErrorNotification = props => {
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

const DefaultNotification = props => {
  return (
    <div>
      <div className={styles.tip}>Tip</div>
      <div className={styles.tip_text}>Your protocol is now running. You may unplug your computer from the robot and reconnect later without affecting the job.</div>
    </div>
  )
}

const PausedNotification = props => {
  return (
    <div className={styles.notification_wrapper}>
      <div className={styles.notification_icon}>II</div>
      <div className={styles.notification_message}>
        <span className={styles.type}>PAUSED</span>
      </div>
    </div>
  )
}

function RunNotifications ({ running, paused, errors, hasError }) {
  let notification
  // changed this to assume running means you have hit run button, and have not canceled
  if (running && !paused && !hasError) {
    notification = <DefaultNotification />
  } else if (paused) {
    notification = <PausedNotification />
  } else if (hasError) {
    notification = <ErrorNotification {...{errors}} />
  }

  return (
    notification
  )
}
export default RunNotifications
