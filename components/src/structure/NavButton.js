// @flow
import * as React from 'react'
import classnames from 'classnames'

import styles from './navbar.css'
import {type IconName, Icon} from '../icons'

type NavButtonProps= {
  onClick?: (event: SyntheticEvent<>) => void,
  isBottom?: boolean,
  className?: string,
  disabled?: boolean,
  isCurrent?: boolean,
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
      <Icon name={props.iconName} />
    </button>
  )
}
