// @flow
import * as React from 'react'
import { NavLink } from './NavLink'
import { NavMenuItems } from './NavMenuItems'
import styles from './MainNav.module.css'

import type { Submenu } from './types'
import cx from 'classnames'

type Props = {|
  ...Submenu,
  name?: string,
  className?: string,
  onToggle: (name: string | null) => void,
  homeUrl: string,
|}

export function NavMenu(props: Props): React.Node {
  const { name, links, url, text, active, onToggle, homeUrl } = props
  const [isOpen, setIsOpen] = React.useState(false)
  React.useEffect(() => {
    setTimeout(() => setIsOpen(active), 100)
  }, [active])

  return (
    <li
      className={cx(styles.nav_url, {
        [styles.nav_url_active]: active,
        [styles.nav_url_parent]: !!links,
      })}
      role="button"
      onClick={() => onToggle(name || null)}
    >
      {url ? (
        <NavLink {...props} className={styles.nav_url_name} homeUrl={homeUrl} />
      ) : (
        <span className={styles.nav_url_name}>{name}</span>
      )}

      {active && links ? (
        <div
          className={cx(styles.dropdown_small, {
            [styles.dropdown_small_open]: isOpen,
          })}
        >
          <button
            onClick={() => onToggle(null)}
            className={styles.nav_sub_name}
          >
            {name}
          </button>
          <ul
            className={cx(styles.nav_sub, {
              [styles.nav_sub_support]: name
                ? name.toLowerCase()
                : '' === 'support',
            })}
          >
            {links.map((subnav, index) => (
              <NavMenuItems key={index} {...subnav} homeUrl={homeUrl} />
            ))}
          </ul>
          {text ? (
            <div
              dangerouslySetInnerHTML={{ __html: text }}
              className={styles.nav_text}
            />
          ) : null}
        </div>
      ) : null}
    </li>
  )
}
