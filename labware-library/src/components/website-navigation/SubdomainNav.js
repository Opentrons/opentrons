// @flow
// top subdomain nav bar component
import * as React from 'react'
import { Link } from 'react-router-dom'
import { getPublicPath } from '../../public-path'
import styles from './styles.css'

export const SUBDOMAIN_NAV_LINKS = [
  { name: 'Python API', url: 'https://docs.opentrons.com/' },
  { name: 'Labware Library', to: getPublicPath() },
  { name: 'Protocol Library', url: 'https://protocols.opentrons.com/' },
  { name: 'Protocol Designer', url: 'https://designer.opentrons.com/' },
]

export function SubdomainNav() {
  return (
    <ul className={styles.subdomain_nav_contents}>
      {SUBDOMAIN_NAV_LINKS.map((link, index) => {
        if (link.to) {
          return (
            <li key={index}>
              <Link to={link.to} className={styles.subdomain_link}>
                {link.name}
              </Link>
            </li>
          )
        }
        return (
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
        )
      })}
    </ul>
  )
}
