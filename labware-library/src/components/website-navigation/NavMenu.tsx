import * as React from 'react'
import { NavLink } from './NavLink'
import styles from './styles.module.css'

import type { Submenu } from './types'

interface Props extends Submenu {
  active: boolean
}

export function NavMenu(props: Props): JSX.Element {
  const { name, links, bottomLink, active } = props
  return (
    <>
      <span>{name}</span>
      {active && (
        <div className={styles.dropdown_small}>
          <div className={styles.dropdown_content}>
            <ul>
              {links.map((link, index) => (
                <li key={index}>
                  <NavLink {...link} />
                </li>
              ))}
            </ul>
          </div>
          {bottomLink && (
            <a
              href={bottomLink.url}
              className={styles.bottom_link}
              target="_blank"
              rel="noopener noreferrer"
            >
              {bottomLink.name} ›
            </a>
          )}
        </div>
      )}
    </>
  )
}
