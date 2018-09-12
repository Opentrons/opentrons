// @flow
import * as React from 'react'
import classnames from 'classnames'
import styles from './navbar.css'

type NavProps= {
  className?: string,
  children: React.Node,
}

export default function VerticalNavBar (props: NavProps) {
  const className = classnames(styles.navbar, props.className)
  return (
    <nav className={className}>
      {props.children}
    </nav>
  )
}
