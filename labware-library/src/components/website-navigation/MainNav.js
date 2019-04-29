// @flow
import * as React from 'react'
import Logo from './Logo'
import { NavList } from './NavList'
import MenuButton from './MenuButton'
import styles from './styles.css'

import type { MobileNavProps } from './types'

export function MainNav(props: MobileNavProps) {
  return (
    <div className={styles.main_nav_contents}>
      <Logo />
      <NavList />
      <MenuButton
        onMobileClick={props.onMobileClick}
        isMobileOpen={props.isMobileOpen}
      />
    </div>
  )
}
