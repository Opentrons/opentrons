// ListItem component to be used as a child of TitledList
import * as React from 'react'
import { NavLink } from 'react-router-dom'
import classnames from 'classnames'

import styles from './lists.module.css'
import { Icon } from '../icons'
import type { IconName } from '../icons'

// TODO(bc, 2021-03-31): this is only used in the app
// reconsider whether this belongs in components library
interface ListItemProps {
  /** click handler */
  onClick?: (event: React.SyntheticEvent) => unknown
  /** mouse enter handler */
  onMouseEnter?: (event: React.MouseEvent) => unknown
  /** mouse leave handler */
  onMouseLeave?: (event: React.MouseEvent) => unknown
  /** mouse enter handler */
  onPointerEnter?: (event: React.PointerEvent) => unknown
  /** mouse leave handler */
  onPointerLeave?: (event: React.PointerEvent) => unknown
  /** if URL is specified, ListItem is wrapped in a React Router NavLink */
  url?: string | null
  /** if URL is specified NavLink can receive an active class name */
  activeClassName?: string
  /** if URL is specified NavLink can receive an exact property for matching routes */
  exact?: boolean
  /** Additional class name */
  className?: string
  /** if disabled, the onClick handler will be disabled */
  isDisabled?: boolean
  /** name constant of the icon to display */
  iconName?: IconName
  'aria-describedby'?: string
  ref?: { current: Element | null } | ((current: Element | null) => unknown)
  children?: React.ReactNode
}

/**
 * A styled `<li>` with an optional icon, and an optional url for a React Router `NavLink`
 *
 */
export const ListItem = React.forwardRef(
  (props: ListItemProps, ref: React.ForwardedRef<HTMLLIElement>) => {
    const { url, isDisabled, iconName, activeClassName, exact } = props
    const onClick = props.onClick && !isDisabled ? props.onClick : undefined
    // @ts-expect-error(sa, 2021-6-23): cast value to boolean
    const className = classnames(props.className, styles.list_item, {
      [styles.disabled]: isDisabled,
      [styles.clickable]: onClick,
    })

    const itemIcon = iconName && (
      <Icon className={styles.item_icon} name={iconName} />
    )

    if (url != null) {
      return (
        <li
          onMouseEnter={props.onMouseEnter}
          onMouseLeave={props.onMouseLeave}
          ref={ref}
        >
          <NavLink
            to={url}
            onClick={onClick}
            className={className}
            activeClassName={activeClassName}
            exact={exact}
          >
            {itemIcon}
            {props.children}
          </NavLink>
        </li>
      )
    }

    return (
      <li
        ref={ref}
        onClick={onClick}
        onMouseEnter={props.onMouseEnter}
        onMouseLeave={props.onMouseLeave}
        className={className}
      >
        {itemIcon}
        {props.children}
      </li>
    )
  }
)
