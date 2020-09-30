// @flow
import * as React from 'react'
import styles from './styles.css'
import { NavLink } from './NavLink'
import { protocolLinkProps } from './nav-data'

type Props = {|
  active: boolean,
|}

export function ProtocolMenu(props: Props): React.Node {
  const { active } = props
  const {
    options,
    designer,
    library,
    api,
    github,
    bottomLink,
  } = protocolLinkProps
  return (
    <>
      <span>Protocols</span>
      {active && (
        <div className={styles.dropdown_medium}>
          <div className={styles.dropdown_content}>
            <div className={styles.dropdown_col}>
              <NavLink {...options} />
              <NavLink {...designer} />
              <NavLink {...library} />
            </div>
            <div className={styles.dropdown_col}>
              <NavLink {...api} />
              <NavLink {...github} />
            </div>
          </div>
          <a
            href={bottomLink.url}
            className={styles.bottom_link_center}
            target="_blank"
            rel="noopener noreferrer"
          >
            {bottomLink.name} ›
          </a>
        </div>
      )}
    </>
  )
}
