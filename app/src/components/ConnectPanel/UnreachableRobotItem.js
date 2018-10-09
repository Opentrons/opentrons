// @flow
// list of robots
import * as React from 'react'
import type {UnreachableRobot} from '../../discovery'
import {Icon, HoverTooltip} from '@opentrons/components'
import RobotLink from './RobotLink'
import styles from './styles.css'

export default function UnreachableRobotItem (props: UnreachableRobot) {
  const {name} = props
  return (
    <li className={styles.robot_group}>
      <HoverTooltip
        tooltipComponent={<div>Unable to locate this robot</div>}
        placement="bottom"
      >
        {hoverTooltipHandlers => (
          <RobotLink
            url="#"
            className={styles.robot_item}
            exact
            disabled
            hoverTooltipHandlers={hoverTooltipHandlers}
          >
            <Icon
              name={'alert-circle'}
              className={styles.robot_item_icon}
              disabled
            />
            <p className={styles.link_text}>{name}</p>
          </RobotLink>
        )}
      </HoverTooltip>
    </li>
  )
}
