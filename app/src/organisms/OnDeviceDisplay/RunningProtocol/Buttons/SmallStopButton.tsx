import * as React from 'react'
import { css } from 'styled-components'

import {
  Btn,
  ALIGN_CENTER,
  COLORS,
  JUSTIFY_CENTER,
  Icon,
  SPACING,
} from '@opentrons/components'

const STOP_BUTTON_STYLE = css`
  display: flex;
  height: 6.25rem;
  width: 6.25rem;
  background-color: ${COLORS.red_two};
  border-radius: 50%;

  &:focus {
    background-color: #c41e20;
    box-shadow: none;
  }
  &:hover {
    border: none;
    box-shadow: none;
    background-color: ${COLORS.red_two};
    color: ${COLORS.white};
  }
  &:focus-visible {
    box-shadow: 0 0 0 ${SPACING.spacing1} ${COLORS.fundamentalsFocus};
    background-color: ${COLORS.red_two};
  }
  &:active {
    background-color: ${COLORS.red_two};
  }
  &:disabled {
    background-color: ${COLORS.darkBlack_twenty};
    color: ${COLORS.darkBlack_sixty};
  }
`

interface SmallStopButtonProps {
  onStop?: () => void
}

export function SmallStopButton({ onStop }: SmallStopButtonProps): JSX.Element {
  return (
    <Btn
      css={STOP_BUTTON_STYLE}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
      onClick={onStop}
      aria-label="close"
    >
      <Icon name="close" color={COLORS.white} size="5rem" />
    </Btn>
  )
}
