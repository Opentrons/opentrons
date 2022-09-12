import * as React from 'react'
import { css } from 'styled-components'
import { COLORS, SIZE_2 } from '@opentrons/components'
import { ToggleBtn, ToggleBtnProps } from '../ToggleBtn'

const TOGGLE_DISABLED_STYLES = css`
  color: ${COLORS.darkGreyEnabled};

  &:hover {
    color: ${COLORS.darkGreyHover};
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.warningEnabled};
  }

  &:disabled {
    color: ${COLORS.darkGreyDisabled};
  }
`

const TOGGLE_ENABLED_STYLES = css`
  color: ${COLORS.blueEnabled};

  &:hover {
    color: ${COLORS.blueHover};
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.warningEnabled};
  }

  &:disabled {
    color: ${COLORS.darkGreyDisabled};
  }
`

export const ToggleButton = (props: ToggleBtnProps): JSX.Element => {
  return (
    <ToggleBtn
      size={SIZE_2}
      css={props.toggledOn ? TOGGLE_ENABLED_STYLES : TOGGLE_DISABLED_STYLES}
      {...props}
    />
  )
}
