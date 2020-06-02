// @flow
import * as React from 'react'
import map from 'lodash/map'
import { NavLink } from './NavLink'
import styles from './styles.css'

import { protocolLinkProps } from './nav-data'

type Props = {||}

export function ProtocolMobileContent(props: Props): React.Node {
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
