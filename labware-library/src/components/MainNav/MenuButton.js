// @flow
import * as React from 'react'
import styles from './MainNav.module.css'
import menu from './images/menu.svg'
import menuClose from './images/menu_close.svg'

import type { MobileNavProps } from './types'

export function MenuButton(props: MobileNavProps): React.Node {
  return (
    <button onClick={props.onMobileClick} className={styles.nav_button}>
      {!props.isMobileOpen ? (
        <img src={menu} alt="Mobile menu open" />
      ) : (
        <img src={menuClose} alt="Mobile menu open" />
      )}
    </button>
  )
}
