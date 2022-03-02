// primitives based toggle button
// TODO(mc, 2020-10-08): replace ToggleButton in CL with this component
import * as React from 'react'

import {
  C_DARK_GRAY,
  C_DISABLED,
  C_SELECTED_DARK,
  Btn,
  Icon,
} from '@opentrons/components'

import type { StyleProps } from '@opentrons/components'

export interface ToggleBtnProps extends StyleProps {
  label: string
  toggledOn: boolean
  disabled?: boolean | null
  onClick?: (e: React.MouseEvent) => unknown
  id?: string
}

export function ToggleBtn(props: ToggleBtnProps): JSX.Element {
  const { label, toggledOn, disabled, id, ...buttonProps } = props
  const iconName = toggledOn ? 'ot-toggle-switch-on' : 'ot-toggle-switch-off'
  let color = C_DARK_GRAY

  if (disabled) {
    color = C_DISABLED
  } else if (toggledOn) {
    color = C_SELECTED_DARK
  }

  return (
    <Btn
      disabled={disabled ?? false}
      role="switch"
      aria-label={label}
      aria-checked={toggledOn}
      color={color}
      id={id}
      {...buttonProps}
    >
      <Icon name={iconName} />
    </Btn>
  )
}
