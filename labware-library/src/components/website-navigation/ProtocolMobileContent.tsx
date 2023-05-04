import { NavLink } from './NavLink'
import { protocolLinkProps } from './nav-data'
import styles from './styles.css'
import map from 'lodash/map'
import * as React from 'react'

export function ProtocolMobileContent(): JSX.Element {
  const links = map(protocolLinkProps)
  return (
    <ul className={styles.mobile_content}>
      {links.map(link => (
        <li key={link.name}>
          <NavLink {...link} />
        </li>
      ))}
    </ul>
  )
}
