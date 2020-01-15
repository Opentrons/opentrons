// @flow
// reusable toggle button with on off styling for connect to robot and opt in/out
import * as React from 'react'
import cx from 'classnames'
import { IconButton, type ButtonProps } from '@opentrons/components'
import styles from './styles.css'

type ToggleProps = {|
  ...$Exact<ButtonProps>,
  toggledOn: boolean,
|}

export default function ToggleButton(props: ToggleProps) {
  const { toggledOn, ...buttonProps } = props
  const className = cx(styles.robot_item_icon, props.className, {
    [styles.toggled_on]: toggledOn,
    [styles.toggled_off]: !toggledOn,
  })

  const toggleIcon = toggledOn ? 'ot-toggle-switch-on' : 'ot-toggle-switch-off'

  return <IconButton {...buttonProps} name={toggleIcon} className={className} />
}
