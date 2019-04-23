// @flow
import * as React from 'react'
import styles from './styles.css'

import { protocolLinkProps } from './nav-data'

import type { Link } from './types'
type Props = {|
  active: boolean,
|}

export default function ProtocolMenu(props: Props) {
  const { active } = props
  const { options, designer, library, api, github } = protocolLinkProps
  return (
    <>
      <span>Protocols</span>
      {active && (
        <div className={styles.dropdown_medium}>
          <div className={styles.dropdown_group}>
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
        </div>
      )}
    </>
  )
}

function NavLink(props: Link) {
  return (
    <div className={styles.link_group}>
      <a
        href={props.url}
        className={styles.link_title}
        target="_blank"
        rel="noopener noreferrer"
      >
        {props.name}
      </a>
      <div className={styles.link_description}>{props.description}</div>
    </div>
  )
}
