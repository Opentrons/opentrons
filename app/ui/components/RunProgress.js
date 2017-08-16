import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import styles from './RunProgress.css'

const RunProgress = ({ progress, hasError, isPaused }) => (
  <div className={styles.bar_wrapper}>
    <div className={classnames(styles.bar, {[styles.error_bar]: hasError, [styles.paused_bar]: isPaused})} style={{width: `${progress}%`}} />
  </div>
)

RunProgress.propTypes = {
  progress: PropTypes.number,
  hasError: PropTypes.bool,
  paused: PropTypes.bool
}

export default RunProgress
