// @flow
import cx from 'classnames'
import * as React from 'react'

import type { ButtonProps } from './Button'
import { Button } from './Button'
import styles from './buttons.css'

/**
 * Primary application button. Fills its container and has a dark
 * background with white text
 */
export function PrimaryButton(props: ButtonProps): React.Node {
  const className = cx(styles.button_primary, props.className, {
    [styles.inverted]: props.inverted,
  })

  return (
    <Button {...props} className={className}>
      {props.children}
    </Button>
  )
}
