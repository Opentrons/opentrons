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
  bottomLink?: Link,
  onClickOutside: ?(MouseEvent) => mixed,
}

export default function NavDropdown(props: Props) {
  const { bottomLink, onClickOutside } = props
  return (
    <ClickOutside onClickOutside={onClickOutside}>
      {({ ref }) => (
        <div className={styles.dropdown_small} ref={ref}>
          <div className={styles.dropdown_content}>
            <ul>
              {props.links.map((link, index) => (
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
    </ClickOutside>
  )
}
