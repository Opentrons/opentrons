// flow
import * as React from 'react'
import Logo from './Logo'
import { NavList } from './NavList'
import MenuButton from './MenuButton'
import styles from './styles.css'

export function MainNav() {
  return (
    <div className={styles.main_nav_contents}>
      <Logo />
      <NavList />
      <MenuButton />
    </div>
  )
}
