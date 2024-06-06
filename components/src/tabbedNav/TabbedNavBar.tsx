import * as React from 'react'
import cx from 'classnames'
import styles from './navbar.module.css'

export interface TabbedNavBarProps {
  className?: string
  topChildren?: React.ReactNode
  bottomChildren?: React.ReactNode
}

export function TabbedNavBar(props: TabbedNavBarProps): JSX.Element {
  const className = cx(styles.navbar, props.className)

  return (
    <nav className={className}>
      <div className={styles.top_section}>{props.topChildren}</div>
      <div className={styles.filler} />
      <div className={styles.bottom_section}>{props.bottomChildren}</div>
    </nav>
  )
}
