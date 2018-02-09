// item in a RobotList
import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import {
  ListItem,
  IconButton,
  USB,
  WIFI,
  TOGGLED_OFF,
  TOGGLED_ON
} from '@opentrons/components'

import styles from './connect-panel.css'

RobotItem.propTypes = {
  name: PropTypes.string.isRequired,
  isConnected: PropTypes.bool.isRequired,
  onConnectClick: PropTypes.func.isRequired,
  onDisconnectClick: PropTypes.func.isRequired
}

export default function RobotItem (props) {
  const {name, wired, isConnected, onConnectClick, onDisconnectClick} = props
  const onClick = isConnected
    ? onDisconnectClick
    : onConnectClick

  const className = cx(styles.robot_item, {
    [styles.connected]: isConnected,
    [styles.disconnected]: !isConnected
  })

  /* TODO (ka 2018-2-7): No onClick passed to IconButton for now because parent
    ListItem receives the onClick temporarily. double toggle = no toggle.
    Once routes in place for connection pages this will be resolved by replacing
    onClick in ListItem with url */
  const toggleIcon = isConnected
    ? TOGGLED_ON
    : TOGGLED_OFF

  const iconName = wired
    ? USB
    : WIFI

  return (
    <ListItem
      onClick={onClick}
      iconName={iconName}
      className={className}
    >
      <p className={styles.robot_name}>{name}</p>
      <IconButton
        name={toggleIcon}
        className={styles.connection_toggle}
      />
    </ListItem>
  )
}
