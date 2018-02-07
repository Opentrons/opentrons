// item in a RobotList
import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import {ListItem, Icon, USB, UNCHECKED_RADIO, CHECKED_RADIO} from '@opentrons/components'

import styles from './connect-panel.css'

RobotItem.propTypes = {
  name: PropTypes.string.isRequired,
  isConnected: PropTypes.bool.isRequired,
  onConnectClick: PropTypes.func.isRequired,
  onDisconnectClick: PropTypes.func.isRequired
}

export default function RobotItem (props) {
  const {name, isConnected, onConnectClick, onDisconnectClick} = props
  const onClick = isConnected
    ? onDisconnectClick
    : onConnectClick
  const className = cx({
    [styles.connected]: isConnected,
    [styles.disconnected]: !isConnected
  })
  // TODO (ka 2018-2-6):this is a temp workaround for pending connection toggle button
  const toggleIcon = isConnected
    ? CHECKED_RADIO
    : UNCHECKED_RADIO
  return (
    <ListItem
      onClick={onClick}
      iconName={USB}
      className={className}
    >
      <p className={styles.robot_name}>{name}</p>
      <Icon name={toggleIcon} className={styles.connection_toggle} />
    </ListItem>
  )
}
