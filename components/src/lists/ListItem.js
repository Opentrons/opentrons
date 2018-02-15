// @flow
// ListItem component to be used as a child of TitledList
import * as React from 'react'
import {NavLink} from 'react-router-dom'
import classnames from 'classnames'

import styles from './lists.css'
import {type IconName, Icon} from '../icons'

type ListItemProps = {
  /** click handler */
  onClick?: (event: SyntheticEvent<>) => void,
  /** if URL is specified, ListItem is wrapped in a React Router NavLink */
  url?: string,
  className?: string,
  activeClassName?: string,
  /** if disabled, the onClick handler / NavLink will be disabled */
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
  const {url, isDisabled, iconName, activeClassName} = props
  const onClick = props.onClick && !isDisabled
    ? props.onClick
    : undefined

  const className = classnames(props.className, styles.list_item, {
    [styles.list_item_link]: url,
    [styles.disabled]: isDisabled,
    [styles.clickable]: onClick
  })

  const itemIcon = iconName && (
    <Icon className={styles.item_icon} name={iconName} />
  )

  const children = (
    <span className={styles.info}>
      {props.children}
    </span>
  )

  if (url) {
    return (
      <li>
        <NavLink
          to={url}
          onClick={onClick}
          disabled={isDisabled}
          className={className}
          activeClassName={activeClassName}
        >
          {itemIcon}
          {children}
        </NavLink>
      </li>
    )
  }

  return (
    <li onClick={onClick} className={className}>
      {itemIcon}
      {children}
    </li>
  )
}
