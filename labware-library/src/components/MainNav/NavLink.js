// @flow
import * as React from 'react'
import cx from 'classnames'
import type { Submenu } from './types'

import styles from './MainNav.module.css'

export type Props = {|
  ...Submenu,
  className?: string,
  onToggle?: (name: string | null) => void,
  homeUrl: string,
  gtm?: {
    action: string,
    category: string,
    label: string,
  },
  linkout?: boolean,
|}

export function NavLink(props: Props): React.Node {
  const { gtm, className, url, homeUrl } = props

  return (
    <>
      <a
        href={props.linkout ? url : `${homeUrl}${url || ''}`}
        className={cx('link_title', className)}
        target="_blank"
        rel="noopener noreferrer"
        data-gtm-category={`l-${gtm ? gtm.category : ''}`}
        data-gtm-label={gtm ? gtm.label : ''}
        data-gtm-action={gtm ? gtm.action : ''}
      >
        {props.name}
        {props.description && (
          <div className={styles.nav_sub_description}>{props.description}</div>
        )}
      </a>
    </>
  )
}
