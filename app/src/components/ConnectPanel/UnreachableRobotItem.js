// @flow
// list of robots
import { HoverTooltip, Icon } from '@opentrons/components'
import * as React from 'react'

import type { UnreachableRobot } from '../../discovery/types'
import { RobotLink } from './RobotLink'
import styles from './styles.css'

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
