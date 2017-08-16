// TODO(mc): maybe put this robot specific component in ui/robot/components
import React from 'react'
import PropTypes from 'prop-types'

import styles from './Connection.css'

export default function Connection (props) {
  const {isConnected, connectionStatus} = props

  // TODO(mc): handle connection in progress (state is in place for this)
  const style = isConnected
    ? styles.connected
    : styles.disconnected

  return (
    <div className={styles.status}>
      <div className={style} />
      <div className={styles.msg}>
        Device {connectionStatus}
      </div>
    </div>
  )
}

Connection.propTypes = {
  isConnected: PropTypes.bool.isRequired,
  connectionStatus: PropTypes.string.isRequired
}
