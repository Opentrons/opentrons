// @flow
import * as React from 'react'
import omit from 'lodash/omit'

import {Icon, type IconName} from '../icons'
import styles from './buttons.css'

export type ButtonProps = {
  /** click handler */
  onClick?: (event: SyntheticEvent<>) => void,
  /** title attribute */
  title?: string,
  /** disabled attribute (setting disabled removes onClick) */
  disabled?: bool,
  /** optional Icon name */
  iconName?: IconName,
  /** classes to apply */
  className?: string,
  /** inverts the default color/background/border of default button style */
  inverted?: boolean,
  /** contents of the button */
  children?: React.Node,
  /** custom element or component to use instead of `<button>` */
  Component?: React.ElementType
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
  const {title, disabled, className} = props
  const onClick = !disabled ? props.onClick : undefined
  const Component = props.Component || 'button'

  // pass all props if using a custom component
  const buttonProps = !props.Component
    ? {title, disabled, onClick, className}
    : {...omit(props, ['iconName', 'children', 'Component']), onClick}

  return (
    <Component {...buttonProps}>
      {props.iconName && (
        <Icon name={props.iconName} className={styles.icon} />
      )}
      {props.children}
    </Component>
  )
}
