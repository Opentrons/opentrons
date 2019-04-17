// @flow
import * as React from 'react'
import styles from './styles.css'

export default function NavList() {
  return (
    <ul className={styles.nav_list}>
      <li className={styles.nav_link}>About</li>
      <li className={styles.nav_link}>Products</li>
      <li className={styles.nav_link}>Applications</li>
      <li className={styles.nav_link}>Protocols</li>
      <li className={styles.nav_link}>Support & Sales</li>
    </ul>
  )
}
