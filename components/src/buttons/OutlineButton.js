// @flow
import * as React from 'react'
import cx from 'classnames'

import type {ButtonProps} from './Button'
import PrimaryButton from './PrimaryButton'
import styles from './buttons.css'

/**
 * `<PrimaryButton>` variant with no background fill and a light border
 */
export default function OutlineButton (props: ButtonProps) {
  const className = cx(styles.button_outline, props.className)

  return (
    <PrimaryButton {...props} className={className}>
      {props.children}
    </PrimaryButton>
  )
}
