// @flow
import cx from 'classnames'
import * as React from 'react'

import type { ButtonProps } from './Button'
import { Button } from './Button'
import styles from './buttons.css'

/**
 * Button with no background fill and a dark border.
 Use inverted prop for buttons on dark backgrounds.
 */
export function OutlineButton(props: ButtonProps): React.Node {
  const className = cx(styles.button_outline, props.className, {
    [styles.inverted]: props.inverted,
  })

  return (
    <Button {...props} className={className}>
      {props.children}
    </Button>
  )
}
