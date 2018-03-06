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

  const className = cx(styles.connection_toggle, {
    [styles.connected]: isConnected,
    [styles.disconnected]: !isConnected
  })

  /* TODO (ka 2018-2-13):
  Toggle Button Class based on connectivity,
  NavLink gets ActiveClassName in ListItem
  */
  const toggleIcon = isConnected
    ? TOGGLED_ON
    : TOGGLED_OFF

  const iconName = wired
    ? USB
    : WIFI

  return (
    <ListItem
      url={`/robots/${name}`}
      iconName={iconName}
      className={styles.robot_item}
      activeClassName={styles.active}
    >
      <p className={styles.robot_name}>{name}</p>
      <IconButton
        name={toggleIcon}
        className={className}
        onClick={onClick}
      />
    </ListItem>
  )
}
