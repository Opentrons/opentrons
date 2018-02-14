// @flow
import * as React from 'react'
import cx from 'classnames'

import Button, {type ButtonProps} from './Button'
import styles from './buttons.css'

/**
 * Primary application button. Fills its container and has a dark
 * background with white text
 */
export default function PrimaryButton (props: ButtonProps) {
  const className = cx(styles.button_primary, props.className)

  return (
    <Button {...props} className={className}>
      {props.children}
    </Button>
  )
}
