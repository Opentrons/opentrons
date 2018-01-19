// @flow
import * as React from 'react'

import {Icon, type IconName} from '../icons'
import styles from './buttons.css'

export type ButtonProps = {
  /** click handler */
  onClick: (event: SyntheticEvent<>) => void,
  /** title attribute */
  title?: string,
  /** disabled attribute (setting disabled removes onClick) */
  disabled?: bool,
  /** optional Icon name */
  iconName?: IconName,
  /** classes to apply */
  className?: string,
  /** contents of the button */
  children?: React.Node
}

/**
 * Basic, unstyled button. You probably want to use a styled button
 * instead. All buttons take the same props.
 *
 * If you need access to the ButtonProps type, you can:
 * ```js
 * import {type ButtonProps} from '@opentrons/components'
 * ```
 */
export default function Button (props: ButtonProps) {
  const {disabled} = props
  const onClick = disabled ? undefined : props.onClick

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      title={props.title}
      className={props.className}
    >
      {props.iconName && (
        <Icon name={props.iconName} className={styles.button_icon} />
      )}
      {props.children}
    </button>
  )
}
