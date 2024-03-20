import * as React from 'react'
import cx from 'classnames'

import { Button } from './Button'
import styles from './buttons.module.css'

import type { ButtonProps } from './Button'

/**
 * Primary application button. Fills its container and has a dark
 * background with white text
 *
 * @deprecated Use {@link PrimaryButton}
 */
export function DeprecatedPrimaryButton(props: ButtonProps): JSX.Element {
  const className = cx(styles.button_primary, props.className, {
    [styles.inverted]: props.inverted,
  })

  return (
    <Button {...props} className={className}>
      {props.children}
    </Button>
  )
}
