import React from 'react'
import PropTypes from 'prop-types'

import styles from './RunProgress.css'


const RunProgress = ({ progress }) => ( 
  <div className={styles.bar_wrapper}>
    <div className={styles.bar} style={{ width: `${progress}%`}}>
    </div>
  </div>
)

RunProgress.propTypes = {
  
}

export default RunProgress