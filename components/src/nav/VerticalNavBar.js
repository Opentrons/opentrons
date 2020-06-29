// @flow
import classnames from 'classnames'
import * as React from 'react'

import styles from './navbar.css'

export type VerticalNavBarProps = {|
  className?: string,
  children: React.Node,
|}

export function VerticalNavBar(props: VerticalNavBarProps): React.Node {
  const className = classnames(styles.navbar, props.className)
  return <nav className={className}>{props.children}</nav>
}
