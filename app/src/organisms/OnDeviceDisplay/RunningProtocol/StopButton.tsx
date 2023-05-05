import * as React from 'react'
import {
  Icon,
  Btn,
  ALIGN_CENTER,
  COLORS,
  JUSTIFY_CENTER,
  SPACING,
} from '@opentrons/components'
import { css } from 'styled-components'

const STOP_BUTTON_STYLE = css`
  display: flex;
  background-color: ${COLORS.red2};
  border-radius: 50%;

  &:focus {
    background-color: #c41e20;
    box-shadow: none;
  }
  &:hover {
    border: none;
    box-shadow: none;
    background-color: ${COLORS.red2};
    color: ${COLORS.white};
  }
  &:focus-visible {
    box-shadow: 0 0 0 ${SPACING.spacing1} ${COLORS.fundamentalsFocus};
    background-color: ${COLORS.red2};
  }
  &:active {
    background-color: ${COLORS.red2};
  }
  &:disabled {
    background-color: ${COLORS.darkBlack20};
    color: ${COLORS.darkBlack60};
  }
`

interface StopButtonProps {
  onStop?: () => void
  /** default size 12.5rem */
  buttonSize?: string
  /** default size 10rem */
  iconSize?: string
}
export function StopButton({
  onStop,
  buttonSize = '12.5rem',
  iconSize = '10rem',
}: StopButtonProps): JSX.Element {
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
      <Icon name="close" color={COLORS.white} size={iconSize} />
    </Btn>
  )
}
