import * as React from 'react'
import classnames from 'classnames'

import { Button } from './Button'
import styles from './buttons.module.css'

import type { ButtonProps } from './Button'

/**
 * Flat-styled button with a default width of `9rem` and no background fill
 */
export function FlatButton(props: ButtonProps): JSX.Element {
  const className = classnames(styles.button_flat, props.className, {
    [styles.inverted]: props.inverted,
  })

  return (
    <Button {...props} className={className}>
      {props.children}
    </Button>
  )
}
