import * as React from 'react'
import { css } from 'styled-components'
import { Btn, COLORS, SPACING } from '@opentrons/components'

const overflowButtonStyles = css`
  border-radius: ${SPACING.spacing2};
  max-height: ${SPACING.spacing6};

  &:hover {
    background-color: ${COLORS.medGrey};
  }

  &:active {
    background-color: ${COLORS.lightBlue};
  }

  &:active circle {
    fill: ${COLORS.blue};
  }

  &:focus {
    box-shadow: 0 0 0 3px ${COLORS.blueFocus};
  }

  &:disabled,
  &.disabled {
    fill-opacity: 0.5;
  }
`

export const OverflowBtn = (
  props: React.ComponentProps<typeof Btn>
): JSX.Element | null => {
  return (
    <Btn css={overflowButtonStyles} {...props}>
      <svg
        width="19"
        height="31"
        viewBox="0 0 19 31"
        fill={COLORS.darkGrey}
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="9.5" cy="9.5" r="1.5" />
        <circle cx="9.5" cy="15.5" r="1.5" />
        <circle cx="9.5" cy="21.5" r="1.5" />
      </svg>
      {props.children}
    </Btn>
  )
}
