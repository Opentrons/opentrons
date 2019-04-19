// @flow
import * as React from 'react'
import { ClickOutside } from '@opentrons/components'
import styles from './styles.css'

export type Link = {
  name: string,
  url?: string,
  to?: string, // TODO: (ka 2019-4-18): refactor component to take ?Links
}

type Props = {
  name: string,
  links: Array<Link>,
  active: boolean,
  bottomLink?: Link,
  onClick: ?(MouseEvent) => mixed,
}

export default function NavDropdown(props: Props) {
  const { name, bottomLink, onClick, links, active } = props
  return (
    <ClickOutside onClickOutside={onClick}>
      {({ ref }) => (
        <li className={styles.nav_link} key={name} onClick={onClick}>
          <span>{name}</span>
          {active && (
            <div className={styles.dropdown_small} ref={ref}>
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
        </li>
      )}
    </ClickOutside>
  )
}
