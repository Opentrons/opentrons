// @flow
import * as React from 'react'
import styles from './styles.css'

import type { Submenu } from './types'

type Props = {|
  ...Submenu,
  active: boolean,
|}

export default function NavMenu(props: Props) {
  const { name, links, bottomLink, active } = props

  return (
    <>
      <span>{name}</span>
      {active && (
        <div className={styles.dropdown_small}>
          <div className={styles.dropdown_content}>
            <ul>
              {links.map((link, index) => (
                <li key={index} className={styles.dropdown_item}>
                  <a
                    href={link.url}
                    className={styles.dropdown_link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.name}
                  </a>
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
              {bottomLink.name} &nbsp; &gt;
            </a>
          )}
        </div>
      )}
    </>
  )
}
