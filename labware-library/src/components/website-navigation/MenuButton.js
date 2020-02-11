// @flow
import * as React from 'react'
import { ClickableIcon } from '../ui'
import styles from './styles.css'

import type { MobileNavProps } from './types'

export function MenuButton(props: MobileNavProps) {
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
