import * as React from 'react'
import { NavLink } from 'react-router-dom'
import classnames from 'classnames'

import styles from './navbar.module.css'
import { Button } from '../buttons'
import { NotificationIcon } from '../icons'

import type { IconName } from '../icons'
import type { ButtonProps } from '../buttons'

export interface NavTabProps {
  /** optional click event for nav button */
  onClick?: React.MouseEventHandler
  /** optional url for nav button route */
  url?: string
  /** position a single button on the bottom of the page */
  isBottom?: boolean
  /** classes to apply */
  className?: string
  /** id */
  id?: string
  /** disabled attribute (setting disabled removes onClick) */
  disabled?: boolean
  /** optional title to display below the icon */
  title?: string
  /** Icon name for button's icon */
  iconName: IconName
  /** Display a notification dot */
  notification?: boolean
  /** selected styling (can also use react-router & `activeClassName`) */
  selected?: boolean
}

export function NavTab(props: NavTabProps): JSX.Element {
  const { url } = props
  const className = classnames(props.className, styles.tab, {
    [styles.disabled]: props.disabled,
    [styles.bottom]: props.isBottom,
    [styles.selected]: props.selected,
  })

  let buttonProps: ButtonProps = {
    id: props.id,
    className: className,
    disabled: props.disabled,
    onClick: props.onClick,
  }

  if (url) {
    buttonProps = {
      ...buttonProps,
      Component: NavLink,
      to: url,
      activeClassName: styles.selected,
    }
  }

  return (
    <Button {...buttonProps}>
      <NotificationIcon
        name={props.iconName}
        childName={props.notification ? 'circle' : null}
        className={styles.icon}
      />
      {props.title && <span className={styles.title}>{props.title}</span>}
    </Button>
  )
}
