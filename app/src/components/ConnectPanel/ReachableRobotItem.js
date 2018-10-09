// @flow
// list of reachable, not connectable robots
import * as React from 'react'
import {NotificationIcon, Icon} from '@opentrons/components'

import RobotLink from './RobotLink'
import styles from './styles.css'

type ReachableProps = {
  name: string,
  wired: boolean, // switch to local
  upgradable: boolean,
}

export default function ReachableRobotItem (props: ReachableProps) {
  const {name, wired, upgradable} = props
  return (
    <li className={styles.robot_group}>
      <RobotLink url={`/robots/${name}`} className={styles.robot_item} exact>
        <NotificationIcon
          name={wired ? 'usb' : 'wifi'}
          className={styles.robot_item_icon}
          childName={upgradable ? 'circle' : null}
          childClassName={styles.notification}
        />

        <p className={styles.link_text}>{name}</p>

        <Icon name="chevron-right" className={styles.robot_item_icon} />
      </RobotLink>
    </li>
  )
}
