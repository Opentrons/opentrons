// @flow
import * as React from 'react'
import {NavLink} from 'react-router-dom'
import classnames from 'classnames'

import styles from './navbar.css'
import {type IconName, Icon} from '../icons'

type NavButtonProps= {
  /** optional click event for nav button */
  onClick?: (event: SyntheticEvent<>) => void,
  /** optional url for nav button route */
  url?: string,
  /** position a single button on the bottom of the page */
  isBottom?: boolean,
  /** classes to apply */
  className?: string,
  /** disabled attribute (setting disabled removes onClick) */
  disabled?: boolean,
  /** optional title to display below the icon */
  title?: string,
  /** Icon name for button's icon */
  iconName: IconName
}

export default function NavButton (props: NavButtonProps) {
  const className = classnames(
    styles.button,
    {[styles.disabled]: props.disabled},
    {[styles.bottom]: props.isBottom},
    props.className
  )
  if (props.url) {
    return (
      <NavLink
        className={className}
        disabled={props.disabled}
        onClick={props.onClick}
        to={props.url}
        activeClassName={styles.active}
      >
        <Icon name={props.iconName} className={styles.icon} />
        {props.title && (<span className={styles.title}>{props.title}</span>)}
      </NavLink>
    )
  }
  return (
    <button
      className={className}
      disabled={props.disabled}
      onClick={props.onClick}
    >
      <Icon name={props.iconName} className={styles.icon} />
      {props.title && (<span className={styles.title}>{props.title}</span>)}
    </button>
  )
}
