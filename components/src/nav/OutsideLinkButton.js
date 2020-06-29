// @flow
import cx from 'classnames'
import * as React from 'react'

import { Button } from '../buttons'
import type { IconName } from '../icons'
import { NotificationIcon } from '../icons'
import styles from './navbar.css'

type OutsideLinkButtonProps = {|
  /** optional click event for nav button */
  onClick?: (event: SyntheticEvent<>) => mixed,
  /** link to outside URL */
  to: string,
  /** position a single button on the bottom of the page */
  isBottom?: boolean,
  /** classes to apply */
  className?: string,
  /** disabled attribute (setting disabled removes onClick) */
  disabled?: boolean,
  /** optional title to display below the icon */
  title?: string,
  /** Icon name for button's icon */
  iconName: IconName,
  /** Display a notification dot */
  notification?: boolean,
  /** selected styling (can also use react-router & `activeClassName`) */
  selected?: boolean,
|}

/** Very much like NavButton, but used for opening external links in a new tab/window */
export function OutsideLinkButton(props: OutsideLinkButtonProps): React.Node {
  const className = cx(props.className, styles.button, styles.no_link, {
    [styles.disabled]: props.disabled,
    [styles.bottom]: props.isBottom,
    [styles.active]: props.selected,
  })
  return (
    <Button
      className={className}
      disabled={props.disabled}
      onClick={props.onClick}
      Component="a"
      href={props.disabled ? '' : props.to}
      target="_blank"
      rel="noopener noreferrer"
    >
      <NotificationIcon
        name={props.iconName}
        childName={props.notification ? 'circle' : null}
        className={styles.icon}
        childClassName={styles.notification}
      />
      {props.title && <span className={styles.title}>{props.title}</span>}
    </Button>
  )
}
