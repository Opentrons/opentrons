// @flow
import * as React from 'react'
import { Logo } from './Logo'
import { NavList } from './NavList'
import { MobileNav } from './MobileNav'
import styles from './styles.css'

export function MainNav(): React.Node {
  return (
    <div className={styles.main_nav_contents}>
      <Logo />
      <NavList />
      <MobileNav />
    </div>
  )
}
