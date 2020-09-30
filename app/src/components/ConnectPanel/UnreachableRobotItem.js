// @flow
// list of robots
import * as React from 'react'

import { Icon, HoverTooltip } from '@opentrons/components'
import { RobotLink } from './RobotLink'
import styles from './styles.css'

import type { UnreachableRobot } from '../../discovery/types'

export function UnreachableRobotItem(props: UnreachableRobot): React.Node {
  const { displayName } = props
  return (
    <li className={styles.robot_group}>
      <HoverTooltip
        tooltipComponent={<div>Unable to locate this robot</div>}
        placement="bottom"
      >
        {hoverTooltipHandlers => (
          <RobotLink
            url=""
            className={styles.robot_item}
            disabled
            hoverTooltipHandlers={hoverTooltipHandlers}
          >
            <Icon name={'alert-circle'} className={styles.robot_item_icon} />
            <p className={styles.link_text}>{displayName}</p>
          </RobotLink>
        )}
      </HoverTooltip>
    </li>
  )
}
