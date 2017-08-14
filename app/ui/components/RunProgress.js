import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import styles from './RunProgress.css'


const RunProgress = ({ progress, hasError, paused }) => ( 
  <div className={styles.bar_wrapper}>
    <div className={ classnames(styles.bar, {[styles.error_bar] : hasError, [styles.paused_bar] : paused}) } style={{ width: `${progress}%`}}>
    </div>
  </div>
)

RunProgress.propTypes = {
  
}

export default RunProgress