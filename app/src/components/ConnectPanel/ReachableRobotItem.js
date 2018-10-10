// @flow
// list of reachable, not connectable robots
import * as React from 'react'
import {Icon} from '@opentrons/components'

import RobotLink from './RobotLink'
import styles from './styles.css'

import type {ReachableRobot} from '../../discovery'

export default function ReachableRobotItem (props: ReachableRobot) {
  const {name, local} = props // , upgradable} = props

  return (
    <li className={styles.robot_group}>
      <RobotLink url={`/robots/${name}`} className={styles.robot_item} exact>
        {/* TODO(mc, 2018-10-10): notification dot */}
        <Icon
          name={local ? 'usb' : 'wifi'}
          className={styles.robot_item_icon}
        />

        <p className={styles.link_text}>{name}</p>

        <Icon name="chevron-right" className={styles.robot_item_icon} />
      </RobotLink>
    </li>
  )
}
