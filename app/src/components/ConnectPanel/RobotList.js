// @flow
// list of robots
import * as React from 'react'
import cx from 'classnames'

import {
  ListItem,
  IconButton,
  NotificationIcon
} from '@opentrons/components'

import type {Robot} from '../../robot'
import styles from './connect-panel.css'

type ListProps = {
  children: React.Node
}

type ItemProps = Robot & {
  availableUpdate: ?string,
  connect: () => mixed,
  disconnect: () => mixed
}

export default function RobotList (props: ListProps) {
  return (
    <ol className={styles.robot_list}>
      {props.children}
    </ol>
  )
}

export function RobotListItem (props: ItemProps) {
  const {name, wired, isConnected, availableUpdate, connect, disconnect} = props
  const onClick = isConnected
    ? disconnect
    : connect

  const connectButtonClassName = cx(styles.robot_item_icon, {
    [styles.connected]: isConnected,
    [styles.disconnected]: !isConnected
  })

  /* TODO (ka 2018-2-13):
  Toggle Button Class based on connectivity,
  NavLink gets ActiveClassName in ListItem
  */
  const toggleIcon = isConnected
    ? 'ot-toggle-switch-on'
    : 'ot-toggle-switch-off'

  return (
    <ListItem
      url={`/robots/${name}`}
      className={styles.robot_item}
      activeClassName={styles.active}
    >
      <NotificationIcon
        name={wired ? 'usb' : 'wifi'}
        className={styles.robot_item_icon}
        childName={availableUpdate ? 'circle' : null}
        childClassName={styles.notification}
      />

      <p className={styles.robot_name}>
        {name}
      </p>

      <IconButton
        name={toggleIcon}
        className={connectButtonClassName}
        onClick={onClick}
      />
    </ListItem>
  )
}
