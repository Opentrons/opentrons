// @flow
import cx from 'classnames'
import * as React from 'react'

import type { IconProps } from '../icons'
import { Icon } from '../icons'
import type { ButtonProps } from './Button'
import styles from './buttons.css'
import { FlatButton } from './FlatButton'

type Props = {|
  ...$Exact<ButtonProps>,
  name: $PropertyType<IconProps, 'name'>,
  spin?: $PropertyType<IconProps, 'spin'>,
|}

/**
 * FlatButton variant for a button that is a single icon. Takes props of
 * both Button _and_ Icon. Use `name` to specify icon name.
 */
export function IconButton(props: Props): React.Node {
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
      <Icon {...iconProps} className={styles.button_only_icon} />
    </FlatButton>
  )
}
