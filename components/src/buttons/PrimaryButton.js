// @flow
import * as React from 'react'
import classnames from 'classnames'

import {Icon} from '../icons'
import Button, {type ButtonProps} from './Button'
import styles from './buttons.css'

/**
 * Primary application button. Fills its container and has a dark
 * background with white text
 */
export default function PrimaryButton (props: ButtonProps) {
  const className = classnames(styles.button_primary, props.className)

  return (
    <Button {...props} className={className}>
      {props.iconName && <Icon name={props.iconName} className={styles.buttonIcon} />}
      {props.children}
    </Button>
  )
}
