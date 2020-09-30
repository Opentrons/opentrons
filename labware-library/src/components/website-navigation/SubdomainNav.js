// @flow
// top subdomain nav bar component
import * as React from 'react'
import { Link } from 'react-router-dom'
import { getPublicPath } from '../../public-path'
import styles from './styles.css'

type Links = Array<{|
  name: string,
  url: string,
  gtm: {| action: string, category: string, label: string |},
  linkout: boolean,
|}>

export const SUBDOMAIN_NAV_LINKS: Links = [
  {
    name: 'Python API',
    url: 'https://docs.opentrons.com/',
    linkout: true,
    gtm: {
      action: 'click',
      category: 'l-toolbar',
      label: 'opentrons-api',
    },
  },
  {
    name: 'Labware Library',
    url: getPublicPath(),
    linkout: false,
    gtm: {
      action: 'click',
      category: 'l-toolbar',
      label: 'labware-library',
    },
  },
  {
    name: 'Protocol Library',
    url: 'https://protocols.opentrons.com/',
    linkout: true,
    gtm: {
      action: 'click',
      category: 'l-toolbar',
      label: 'protocol-library',
    },
  },
  {
    name: 'Protocol Designer',
    url: 'https://designer.opentrons.com/',
    linkout: true,
    gtm: {
      action: 'click',
      category: 'l-toolbar',
      label: 'protocol-designer',
    },
  },
]

export function SubdomainNav(): React.Node {
  return (
    <ul className={styles.subdomain_nav_contents}>
      {SUBDOMAIN_NAV_LINKS.map((link, index) => {
        const {
          gtm: { category, label, action },
          linkout,
          url,
        } = link
        if (!linkout) {
          return (
            <li key={index}>
              <Link
                to={url}
                className={styles.subdomain_link}
                data-gtm-category={category}
                data-gtm-label={label}
                data-gtm-action={action}
              >
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
              data-gtm-category={category}
              data-gtm-label={label}
              data-gtm-action={action}
            >
              {link.name}
            </a>
          </li>
        )
      })}
    </ul>
  )
}
