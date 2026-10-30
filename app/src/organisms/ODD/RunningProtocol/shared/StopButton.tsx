import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  Btn,
  COLORS,
  Icon,
  JUSTIFY_CENTER,
} from '@opentrons/components'

import { ODD_FOCUS_VISIBLE } from '/app/atoms/buttons/constants'

import type { ReactNode } from 'react'

const STOP_BUTTON_STYLE = css`
  -webkit-tap-highlight-color: transparent;
  display: flex;
  background-color: ${COLORS.red50};
  border-radius: 50%;

  &:focus {
    background-color: ${COLORS.red55};
    box-shadow: none;
  }
  &:hover {
    border: none;
    box-shadow: none;
    background-color: ${COLORS.red50};
    color: ${COLORS.white};
  }
  &:focus-visible {
    box-shadow: ${ODD_FOCUS_VISIBLE};
    background-color: ${COLORS.red50};
  }
  &:active {
    background-color: ${COLORS.red50};
  }
  &:disabled {
    background-color: ${COLORS.grey35};
    color: ${COLORS.grey50};
  }
`

interface StopButtonProps {
  onStop?: () => void
  /** default size 12.5rem */
  buttonSize?: string
  /** default size 5rem */
  iconSize?: string
}
export function StopButton({
  onStop,
  buttonSize = '12.5rem',
  iconSize = '5rem',
}: StopButtonProps): ReactNode {
  return (
    <Btn
      css={STOP_BUTTON_STYLE}
      height={buttonSize}
      width={buttonSize}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
      onClick={onStop}
      aria-label="stop"
    >
      <Icon name="ot-close-thick" color={COLORS.white} size={iconSize} />
    </Btn>
  )
}
