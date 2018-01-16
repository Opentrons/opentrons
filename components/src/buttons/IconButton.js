// @flow
import * as React from 'react'
import classnames from 'classnames'

import {Icon} from '../icons'
import Button, {type ButtonProps} from './Button'
import styles from './buttons.css'

export default function IconButton (props: ButtonProps) {
  const className = classnames(styles.button_icon, props.className)

  return (
    <Button {...props} className={className}>
      {props.iconName && <Icon name={props.iconName} />}
    </Button>
  )
}
