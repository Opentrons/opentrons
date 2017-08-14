import React from 'react'
import styles from './RunNotifications.css'
import PropTypes from 'prop-types' 

const ErrorNotification = props => {
  return (
    <div>
     {props.errors.map((e) => 
        <div key={e} className={styles.error_wrapper}>
          <div className={styles.error_icon}>X</div>
          <div className={styles.error_message}>
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
    <div>
      {props.paused}      
    </div>
  )
}

function RunNotifications ({ running, paused, errors, hasError }){
  const key = `${running}-${paused}-${hasError}`
     return (
        <div>
            {{
                ['true-false-true']: <ErrorNotification {...{errors}} />,
                ['false-true-true']: <ErrorNotification {...{errors}} />,
                ['true-false-false']: <DefaultNotification />,
                ['false-true-false']: <PausedNotification />,
                ['true-true-true']:null
            }[key]}
        </div>
    )
}


export default RunNotifications