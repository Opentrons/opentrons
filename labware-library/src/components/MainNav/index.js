// @flow
import * as React from 'react'
import { Logo } from './Logo'
import { NavList } from './NavList'
import styles from './MainNav.module.css'
import type { Submenu } from './types'

type Props = {|
  homeUrl: string,
  navigationList: Submenu[],
|}

export function MainNav({ navigationList, homeUrl }: Props): React.Node {
  return (
    <div className={styles.main_nav_contents}>
      <Logo />
      <NavList navigationList={navigationList} homeUrl={homeUrl} />
    </div>
  )
}
