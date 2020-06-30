// @flow
// reusable toggle button with on off styling for connect to robot and opt in/out
import * as React from 'react'
import cx from 'classnames'
import { IconButton } from '../buttons'
import type { ButtonProps } from '../buttons'
import styles from './styles.css'

export type ToggleButtonProps = {|
  ...$Exact<ButtonProps>,
  toggledOn: boolean,
|}

export function ToggleButton(props: ToggleButtonProps): React.Node {
  // TODO(mc, 2020-02-04): destructuring `name` to avoid flow error
  // ButtonProps::name conflicts with IconProps::name, and IconButton
  // has `name` prop to pass to Icon. IconButton will need to be redone
  const { toggledOn, name, ...buttonProps } = props
  const className = cx(styles.robot_item_icon, props.className, {
    [styles.toggled_on]: toggledOn,
    [styles.toggled_off]: !toggledOn,
  })

  const toggleIcon = toggledOn ? 'ot-toggle-switch-on' : 'ot-toggle-switch-off'

  return <IconButton {...buttonProps} name={toggleIcon} className={className} />
}
