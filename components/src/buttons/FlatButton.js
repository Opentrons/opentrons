// @flow
import * as React from 'react'
import classnames from 'classnames'

import Button, {type ButtonProps} from './Button'
import styles from './buttons.css'

/**
 * Flat-styled button with a default width of `9rem` and no background fill
 */
export default function FlatButton (props: ButtonProps) {
  const className = classnames(styles.button_flat, props.className)

  return (
    <Button {...props} className={className}>
      {props.children}
    </Button>
  )
}
