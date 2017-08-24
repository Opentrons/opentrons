import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import styles from './RunProgress.css'

export default function RunProgress (props) {
  const {runProgress, hasError, isPaused, style} = props

  return (
    <div className={classnames(styles.bar_wrapper, style)}>
      <div
        className={classnames(styles.bar, {
          [styles.error_bar]: hasError,
          [styles.paused_bar]: isPaused
        })}
        style={{width: `${runProgress}%`}}
      />
    </div>
  )
}

RunProgress.propTypes = {
  runProgress: PropTypes.number.isRequired,
  isPaused: PropTypes.bool.isRequired,
  hasError: PropTypes.bool
}
