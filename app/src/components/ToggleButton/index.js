// @flow
// reusuable toggle button with on off styling for connect to robot and opt in/out
import * as React from 'react'
import cx from 'classnames'
import {IconButton} from '@opentrons/components'
import styles from './styles.css'

type ToggleProps = {
  toggledOn: boolean,
  onClick: () => mixed,
  className?: string
}

export default function ToggleButton (props: ToggleProps) {
  const {toggledOn, onClick} = props
  const className = cx(styles.robot_item_icon, props.className, {
    [styles.toggled_on]: toggledOn,
    [styles.toggled_off]: !toggledOn
  })

  const toggleIcon = toggledOn
    ? 'ot-toggle-switch-on'
    : 'ot-toggle-switch-off'

  return (
    <IconButton
      name={toggleIcon}
      className={className}
      onClick={onClick}
    />
  )
}
