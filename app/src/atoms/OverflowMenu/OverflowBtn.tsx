import * as React from 'react'
import styled from 'styled-components'
import { Btn, COLORS, SPACING, PrimitiveComponent } from '@opentrons/components'

export interface OverflowBtnProps {
  children?: React.ReactNode
}

type BtnComponent = PrimitiveComponent<'button'>
const StyledOverflowIcon: BtnComponent = styled(Btn)`
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
  props: React.ButtonHTMLAttributes<HTMLButtonElement> | OverflowBtnProps
): JSX.Element | null => {
  return (
    <StyledOverflowIcon {...props}>
      <svg
        width="19"
        height="31"
        viewBox="0 0 19 31"
        fill={COLORS.medGrey}
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="9.5"
          cy="9.5"
          r="1.5"
          transform="rotate(90 9.5 9.5)"
          fill={COLORS.darkGrey}
        />
        <circle
          cx="9.5"
          cy="15.5"
          r="1.5"
          transform="rotate(90 9.5 15.5)"
          fill={COLORS.darkGrey}
        />
        <circle
          cx="9.5"
          cy="21.5"
          r="1.5"
          transform="rotate(90 9.5 21.5)"
          fill={COLORS.darkGrey}
        />
      </svg>
      {props.children}
    </StyledOverflowIcon>
  )
}
