import * as React from 'react'
import { ClickableIcon } from '../ui'
import styles from './styles.module.css'

import type { MobileNavProps } from './types'

export function MenuButton(props: MobileNavProps): JSX.Element {
  const iconName = props.isMobileOpen ? 'close' : 'menu'
  return (
    <ClickableIcon
      title="menu"
      name={iconName}
      className={styles.menu_button}
      onClick={props.onMobileClick}
    />
  )
}
