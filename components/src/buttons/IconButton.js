// @flow
import * as React from 'react'
import cx from 'classnames'

import {Icon, type IconProps} from '../icons'
import type {ButtonProps} from './Button'
import FlatButton from './FlatButton'

import styles from './buttons.css'

type Props =
  & ButtonProps
  & IconProps

/**
 * FlatButton variant for a button that is a single icon. Takes props of
 * both Button _and_ Icon. Use `name` to specify icon name.
 */
export default function IconButton (props: Props) {
  const className = cx(styles.button_icon, props.className)

  return (
    <FlatButton {...props} className={className} iconName={undefined}>
      <Icon {...props} className={styles.button_only_icon} />
    </FlatButton>
  )
}
