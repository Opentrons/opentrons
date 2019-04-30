// @flow
import * as React from 'react'
import cx from 'classnames'
import styles from './styles.css'

import type { Link } from './types'

type Props = {|
  ...Link,
  className?: string,
|}

export default function NavLink(props: Props) {
  return (
    <div className={cx(styles.link_group, props.className)}>
      <a
        href={props.url}
        className={cx(styles.link_title, { [styles.link_cta]: props.cta })}
        target="_blank"
        rel="noopener noreferrer"
      >
        {props.name}
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
