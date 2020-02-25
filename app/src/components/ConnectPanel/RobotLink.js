// @flow
// Robot and Instrument links specific to RobotListItem
import * as React from 'react'
import { NavLink } from 'react-router-dom'

import type { HoverTooltipHandlers } from '@opentrons/components'
import cx from 'classnames'
import styles from './styles.css'

export type RobotLinkProps = {|
  children: React.Node,
  url: string,
  className?: string,
  activeClassName?: string,
  hoverTooltipHandlers?: ?HoverTooltipHandlers,
  disabled?: boolean,
|}

export function RobotLink(props: RobotLinkProps) {
  const { url } = props
  const className = cx(styles.robot_link, props.className, {
    [styles.disabled]: props.disabled,
  })
  return (
    <div className={styles.robot_link_wrapper} {...props.hoverTooltipHandlers}>
      <NavLink
        to={url}
        className={className}
        activeClassName={styles.active}
        exact
      >
        {props.children}
      </NavLink>
    </div>
  )
}
