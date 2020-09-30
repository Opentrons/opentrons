// @flow
import * as React from 'react'
import { NavLink } from './NavLink'
import styles from './styles.css'

import type { Submenu } from './types'

type Props = {|
  ...Submenu,
|}

export function MobileContent(props: Props): React.Node {
  const { links } = props
  return (
    <ul className={styles.mobile_content}>
      {links.map((link, index) => (
        <li key={index}>
          <NavLink url={link.url} name={link.name} gtm={link.gtm} />
        </li>
      ))}

      {props.bottomLink && (
        <li>
          <NavLink
            url={props.bottomLink.url}
            name={props.bottomLink.name}
            cta
            gtm={props.bottomLink.gtm}
          />
        </li>
      )}
    </ul>
  )
}
