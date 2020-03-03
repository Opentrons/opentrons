// @flow
// list of robots
import * as React from 'react'
import { NotificationIcon, Icon, ToggleButton } from '@opentrons/components'

import { CONNECTABLE } from '../../discovery'
import { RobotLink } from './RobotLink'
import styles from './styles.css'

// circular type dependency, thanks flow
import type { RobotItemProps } from './RobotItem'

export function RobotListItem(props: RobotItemProps) {
  const { robot, selected, upgradable, connect, disconnect } = props
  const { name, displayName, local, status } = robot
  // unnecessary existence check to satisfy flow
  const connected = robot.connected != null && robot.connected === true
  const connectable = status === CONNECTABLE
  const onClick = connected ? disconnect : connect

  return (
    <li className={styles.robot_group}>
      <RobotLink url={`/robots/${name}`} className={styles.robot_item}>
        <NotificationIcon
          name={local ? 'usb' : 'wifi'}
          className={styles.robot_item_icon}
          childName={upgradable ? 'circle' : null}
          childClassName={styles.notification}
        />

        <p className={styles.link_text}>{displayName}</p>

        {connectable ? (
          <ToggleButton
            toggledOn={connected}
            onClick={onClick}
            className={styles.robot_item_icon}
          />
        ) : (
          <Icon name="chevron-right" className={styles.robot_item_icon} />
        )}
      </RobotLink>
      {connectable && selected && (
        <RobotLink
          url={`/robots/${name}/instruments`}
          className={styles.instrument_item}
        >
          <p className={styles.link_text}>Pipettes & Modules</p>
          <Icon name="chevron-right" className={styles.robot_item_icon} />
        </RobotLink>
      )}
    </li>
  )
}
