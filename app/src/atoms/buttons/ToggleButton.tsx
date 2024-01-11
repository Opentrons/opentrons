import * as React from 'react'
import { css } from 'styled-components'

import { Btn, Icon, LEGACY_COLORS, SIZE_1, SIZE_2 } from '@opentrons/components'

import type { StyleProps } from '@opentrons/components'

const TOGGLE_DISABLED_STYLES = css`
  color: ${LEGACY_COLORS.darkGreyEnabled};

  &:hover {
    color: ${LEGACY_COLORS.darkGreyHover};
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px ${LEGACY_COLORS.warningEnabled};
  }

  &:disabled {
    color: ${LEGACY_COLORS.darkGreyDisabled};
  }
`

const TOGGLE_ENABLED_STYLES = css`
  color: ${LEGACY_COLORS.blueEnabled};

  &:hover {
    color: ${LEGACY_COLORS.blueHover};
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px ${LEGACY_COLORS.warningEnabled};
  }

  &:disabled {
    color: ${LEGACY_COLORS.darkGreyDisabled};
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
