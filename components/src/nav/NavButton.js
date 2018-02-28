// @flow
import * as React from 'react'
import classnames from 'classnames'

import styles from './navbar.css'
import {type IconName, Icon} from '../icons'

type NavButtonProps= {
  /** optional click event for nav button */
  onClick?: (event: SyntheticEvent<>) => void,
  /** position a single button on the bottom of the page */
  isBottom?: boolean,
  /** classes to apply */
  className?: string,
  /** disabled attribute (setting disabled removes onClick) */
  disabled?: boolean,
  /** highlights navbutton if true */
  isCurrent?: boolean,
  /** optional title to display below the icon */
  title?: string,
  /** Icon name for button's icon */
  iconName: IconName
}

export default function NavButton (props: NavButtonProps) {
  const className = classnames(styles.button, {[styles.active]: props.isCurrent}, {[styles.bottom]: props.isBottom}, props.className)

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
