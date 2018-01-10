// @flow
// list components
import * as React from 'react'
import {NavLink} from 'react-router-dom'

import styles from './lists.css'
import {type IconName, Icon} from '../icons'

type ListItemProps = {
  onClick?: (event: SyntheticEvent<>) => void,
  url?: string,
  className?: string,
  isDisabled: boolean,
  iconName?: IconName,
  children: React.Node
}

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
