import * as React from 'react'
import { css } from 'styled-components'

import { Btn, Icon, LEGACY_COLORS, COLORS, SIZE_1, SIZE_2 } from '@opentrons/components'

import type { StyleProps } from '@opentrons/components'

const TOGGLE_DISABLED_STYLES = css`
  color: ${COLORS.grey50Enabled};

  &:hover {
    color: ${COLORS.grey60};
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.yellow50};
  }

  &:disabled {
    color: ${COLORS.grey50Disabled};
  }
`

const TOGGLE_ENABLED_STYLES = css`
  color: ${COLORS.blue50};

  &:hover {
    color: ${COLORS.blue55};
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.yellow50};
  }

  &:disabled {
    color: ${COLORS.grey50Disabled};
  }
`

interface ToggleButtonProps extends StyleProps {
  label: string
  toggledOn: boolean
  disabled?: boolean | null
  id?: string
  onClick?: (e: React.MouseEvent) => unknown
}

export const ToggleButton = (props: ToggleButtonProps): JSX.Element => {
  const { label, toggledOn, disabled, size, ...buttonProps } = props
  const iconName = toggledOn ? 'ot-toggle-input-on' : 'ot-toggle-input-off'

  return (
    <Btn
      disabled={disabled ?? false}
      role="switch"
      aria-label={label}
      aria-checked={toggledOn}
      size={size ?? SIZE_2}
      css={props.toggledOn ? TOGGLE_ENABLED_STYLES : TOGGLE_DISABLED_STYLES}
      {...buttonProps}
    >
      {/* TODO(bh, 2022-10-05): implement small and large sizes from design system */}
      <Icon name={iconName} height={SIZE_1} />
    </Btn>
  )
}
