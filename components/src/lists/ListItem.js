// @flow
// list components
import * as React from 'react'
import {NavLink} from 'react-router-dom'

import styles from './lists.css'
import {type IconName, Icon} from '../icons'

type ListItemProps = {
  /** click handler */
  onClick?: (event: SyntheticEvent<>) => void,
  /** if URL is specified, ListItem is wrapped in a React Router NavLink */
  url?: string,
  className?: string,
  /** if disabled, the NavLink will be disabled */
  isDisabled: boolean,
  /** name constant of the icon to display */
  iconName?: IconName,
  children: React.Node
}

/**
 * A styled `<li>` with an optional icon, and an optional url for a React Router `NavLink`
 *
 */
export default function ListItem (props: ListItemProps) {
  const {url, isDisabled, onClick, iconName} = props
  const itemIcon = iconName && (<Icon className={styles.icon} name={iconName} />)

  if (url) {
    return (
      <li>
        <NavLink
          to={url}
          onClick={onClick}
          disabled={isDisabled}
          activeClassName={styles.active}
          >
          {itemIcon}
          <span className={styles.info}>{props.children}</span>
        </NavLink>
      </li>
    )
  }

  return (
    <li onClick={onClick}>
      {itemIcon}
      <span className={styles.info}>
        {props.children}
      </span>
    </li>
  )
}
