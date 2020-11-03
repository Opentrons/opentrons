// @flow
import * as React from 'react'
import { NavLink } from './NavLink'
import styles from './MainNav.module.css'
import type { Submenu } from './types'

type Props = {|
  ...Submenu,
  className?: string,
  onToggle?: (name: string | null) => void,
  homeUrl: string,
|}

export function NavMenuItems(props: Props): React.Node {
  const { name, links, url, homeUrl } = props
  return (
    <li className={styles.nav_sub_item}>
      {url ? (
        <NavLink {...props} className={styles.nav_sub_link} homeUrl={homeUrl} />
      ) : name ? (
        <span className={styles.nav_sub_title}>{name}</span>
      ) : null}

      {links ? (
        <ul className={styles.nav_sub_sub}>
          {links.map((subnav, index) => (
            <NavMenuItems
              {...subnav}
              key={index}
              className={styles.nav_sublink}
              homeUrl={homeUrl}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}
