// @flow
// Robot and Instrument links specific to RobotListItem
import * as React from 'react'
import {NavLink} from 'react-router-dom'

import cx from 'classnames'
import styles from './connect-panel.css'

type LinkProps = {
  children: React.Node,
  url: string,
  className?: string,
  activeClassName?: string,
}

export default function RobotLink (props: LinkProps) {
  const {url} = props
  const className = cx(styles.robot_link, props.className)
  return (
    <NavLink
      to={url}
      className={className}
      activeClassName={styles.active}
      exact
    >
      {props.children}
    </NavLink>
  )
}
