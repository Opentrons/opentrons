// TODO(mc): maybe put this robot specific component in ui/robot/components
import React from 'react'
import PropTypes from 'prop-types'

import styles from './ConnectionIndicator.css'

export default function Connection (props) {
  const {isConnected} = props

  // TODO(mc): handle connection in progress (state is in place for this)
  const style = isConnected
    ? styles.connected
    : styles.disconnected

  return (
    <div className={styles.connection_status}>
      <div className={styles.status}>
        <div className={style} />
      </div>
    </div>
  )
}

Connection.propTypes = {
  isConnected: PropTypes.bool.isRequired
}
