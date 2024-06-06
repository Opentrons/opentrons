import * as React from 'react'
import { Logo } from './Logo'
import { NavList } from './NavList'
import { MobileNav } from './MobileNav'
import styles from './styles.module.css'

export function MainNav(): JSX.Element {
  return (
    <div className={styles.main_nav_contents}>
      <Logo />
      <NavList />
      <MobileNav />
    </div>
  )
}
