// @flow
import * as React from 'react'

export type ButtonProps = {
  /** click handler */
  onClick: (event: SyntheticEvent<>) => void,
  /** title attribute */
  title?: string,
  /** disabled attribute (setting disabled removes onClick) */
  disabled?: bool,
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
  const onClick = !disabled && props.onClick

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      title={props.title}
      className={props.className}
    >
      {props.children}
    </button>
  )
}
