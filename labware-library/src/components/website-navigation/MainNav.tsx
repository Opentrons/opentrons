import { Logo } from './Logo'
import { MobileNav } from './MobileNav'
import { NavList } from './NavList'
import styles from './styles.css'
import * as React from 'react'

export function MainNav(): JSX.Element {
  return (
    <div className={styles.main_nav_contents}>
      <Logo />
      <NavList />
      <MobileNav />
    </div>
  )
}
