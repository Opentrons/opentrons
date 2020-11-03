// @flow
// top subdomain nav bar component
import * as React from 'react'

import styles from './Subdomain.module.css'
import { NavLink } from '../MainNav/NavLink'
import type { Submenu } from '../MainNav/types'

type Props = {|
  homeUrl: string,
  subdomainList: Submenu[],
|}

export default function SubdomainNav({
  subdomainList,
  homeUrl,
}: Props): React.Node {
  return (
    <ul className={styles.subdomain_nav_contents}>
      <div />
      <div className={styles.link_contents}>
        {/* eslint-disable-next-line react/prop-types */}
        {subdomainList.map(({ gtm, url, name }, index) => (
          <li key={index}>
            <NavLink
              url={url}
              className={styles.subdomain_link}
              gtm={gtm}
              homeUrl={homeUrl}
              name={name}
            />
          </li>
        ))}
      </div>
    </ul>
  )
}
