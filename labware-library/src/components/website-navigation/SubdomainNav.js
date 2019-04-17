// @flow
// top subdomain nav bar component
import * as React from 'react'

import styles from './styles.css'

export const SUBDOMAIN_NAV_LINKS = [
  { name: 'python api', url: 'https://docs.opentrons.com/' },
  { name: 'labware library', url: './' },
  { name: 'protocol library', url: 'https://protocols.opentrons.com/' },
  { name: 'protocol designer', url: 'https://designer.opentrons.com/' },
]

export function SubdomainNav() {
  return (
    <ul className={styles.subdomain_nav_contents}>
      {SUBDOMAIN_NAV_LINKS.map((link, index) => (
        <li key={index}>
          <a
            href={link.url}
            className={styles.subdomain_link}
            target="_blank"
            rel="noopener noreferrer"
          >
            {link.name}
          </a>
        </li>
      ))}
    </ul>
  )
}
