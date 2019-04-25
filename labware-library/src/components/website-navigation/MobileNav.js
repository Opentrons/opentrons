// @flow
import * as React from 'react'
import styles from './styles.css'

// TODO (ka 2019-4-25): Mobile nav items to toggle menu state/submenu
export function MobileNav() {
  return (
    <ul className={styles.mobile_nav}>
      <li className={styles.mobile_nav_item}>About</li>
      <li className={styles.mobile_nav_item}>Products</li>
      <li className={styles.mobile_nav_item}>Applications</li>
      <li className={styles.mobile_nav_item}>Protocols</li>
      <li className={styles.mobile_nav_item}>Support & Sales</li>
    </ul>
  )
}
