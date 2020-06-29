// @flow
import cx from 'classnames'
import * as React from 'react'

import styles from './navbar.css'

export type TabbedNavBarProps = {|
  className?: string,
  topChildren?: React.Node,
  bottomChildren?: React.Node,
|}

export function TabbedNavBar(props: TabbedNavBarProps): React.Node {
  const className = cx(styles.navbar, props.className)

  return (
    <nav className={className}>
      <div className={styles.top_section}>{props.topChildren}</div>
      <div className={styles.filler} />
      <div className={styles.bottom_section}>{props.bottomChildren}</div>
    </nav>
  )
}
