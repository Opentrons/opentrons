// @flow
import * as React from 'react'
import cx from 'classnames'
import styles from './styles.css'

import type { Link } from './types'

export default function NavLink(props: Link) {
  return (
    <div className={styles.link_group}>
      <a
        href={props.url}
        className={cx(styles.link_title, { [styles.link_cta]: props.cta })}
        target="_blank"
        rel="noopener noreferrer"
      >
        {props.name}
        {props.cta && <span>&nbsp; &gt;</span>}
      </a>
      {props.description && (
        <div className={styles.link_description}>{props.description}</div>
      )}
    </div>
  )
}

export function NavButton(props: Link) {
  return (
    <a
      href={props.url}
      className={styles.link_button}
      target="_blank"
      rel="noopener noreferrer"
    >
      {props.name} &nbsp; &gt;
    </a>
  )
}
