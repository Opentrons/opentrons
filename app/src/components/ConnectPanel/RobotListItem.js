// @flow
// list of robots
import * as React from 'react'
import {NotificationIcon, Icon} from '@opentrons/components'

import {ToggleButton} from '../controls'
import RobotLink from './RobotLink'
import styles from './styles.css'

// circular type dependency, thanks flow
import type {RobotItemProps} from './RobotItem'

export function RobotListItem (props: RobotItemProps) {
  const {
    name,
    local,
    connected,
    selected,
    upgradable,
    connect,
    disconnect,
  } = props
  const onClick = connected ? disconnect : connect

  return (
    <li className={styles.robot_group}>
      <RobotLink url={`/robots/${name}`} className={styles.robot_item} exact>
        <NotificationIcon
          name={local ? 'usb' : 'wifi'}
          className={styles.robot_item_icon}
          childName={upgradable ? 'circle' : null}
          childClassName={styles.notification}
        />

        <p className={styles.link_text}>{name}</p>

        <ToggleButton
          toggledOn={connected}
          onClick={onClick}
          className={styles.robot_item_icon}
        />
      </RobotLink>
      {selected && (
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
