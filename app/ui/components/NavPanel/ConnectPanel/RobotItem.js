// item in a RobotList
import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

import Button from '../../Button'
import Icon, {USB} from '../../Icon'
import styles from './connect-panel.css'

RobotItem.propTypes = {
  name: PropTypes.string.isRequired,
  isConnected: PropTypes.bool.isRequired,
  onConnectClick: PropTypes.func.isRequired,
  onDisconnectClick: PropTypes.func.isRequired
}

export default function RobotItem (props) {
  return (
    <li className={styles.robot_item}>
      <RobotItemIcon {...props} />
      <RobotItemControls {...props} />
    </li>
  )
}

function RobotItemIcon (props) {
  const {isConnected} = props
  const className = classnames(styles.robot_icon, {
    [styles.connected]: isConnected,
    [styles.disconnected]: !isConnected
  })

  return (
    <Icon name={USB} className={className} />
  )
}

function RobotItemControls (props) {
  const {name, isConnected, onConnectClick, onDisconnectClick} = props
  const buttonStyle = classnames('btn', 'btn_dark', styles.connect_button)
  const buttonOnClick = (isConnected && onDisconnectClick) || onConnectClick
  const buttonText = (isConnected && 'Disconnect Robot') || 'Connect to Robot'

  return (
    <div className={styles.robot_controls}>
      <p className={styles.robot_name}>{name}</p>
      <div>
        <Button style={buttonStyle} onClick={buttonOnClick}>
          {buttonText}
        </Button>
      </div>
    </div>
  )
}
