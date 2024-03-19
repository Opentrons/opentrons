import * as React from 'react'
import cx from 'classnames'

import { Icon } from '../icons'
import { FlatButton } from './FlatButton'

import styles from './buttons.module.css'

import type { IconProps } from '../icons'
import type { ButtonProps } from './Button'

interface Props extends ButtonProps {
  name: IconProps['name']
  spin?: IconProps['spin']
}

/**
 * FlatButton variant for a button that is a single icon. Takes props of
 * both Button _and_ Icon. Use `name` to specify icon name.
 *
 * @deprecated Use {@link Btn} and {@link Icon}
 */
export function IconButton(props: Props): JSX.Element {
  // TODO(mc, 2020-02-04): ButtonProps::name conflicts with IconProps::name
  // this component will need to be redone so underlying `button` can still
  // receive an HTML name for a11y
  const { name, spin, ...buttonProps } = props
  const iconProps = { name, spin }
  const className = cx(styles.button_icon, props.className, {
    [styles.inverted]: props.inverted,
  })

  return (
    <FlatButton {...buttonProps} className={className} iconName={undefined}>
      <Icon {...iconProps} />
    </FlatButton>
  )
}
