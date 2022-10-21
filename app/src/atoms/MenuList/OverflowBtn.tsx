import * as React from 'react'
import { css } from 'styled-components'
import { Btn, COLORS, SPACING } from '@opentrons/components'

const overflowButtonStyles = css`
  border-radius: ${SPACING.spacing2};
  max-height: ${SPACING.spacing6};

  &:hover {
    background-color: ${COLORS.lightGreyHover};
  }
  &:hover circle {
    fill: ${COLORS.darkGreyHover};
  }

  &:active,
  &:focus {
    background-color: ${COLORS.lightGreyEnabled};
  }

  &:active circle,
  &:focus circle {
    fill: ${COLORS.darkGreyPressed};
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.warningEnabled};
    // focus-visible takes over focus background-color tried focus-only but didn't work
    background-color: transparent;
  }

  &:focus-visible circle {
    fill: ${COLORS.darkGreyHover};
  }

  &:disabled circle {
    fill: ${COLORS.successDisabled};
  }
  &:disabled {
    background-color: transparent;
  }
`

export const OverflowBtn = React.forwardRef(
  (props: React.ComponentProps<typeof Btn>, ref): JSX.Element | null => (
    <Btn css={overflowButtonStyles} {...props} ref={ref}>
      <svg
        width="19"
        height="31"
        viewBox="0 0 19 31"
        fill={COLORS.darkGreyEnabled}
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="9.5" cy="9.5" r="1.5" />
        <circle cx="9.5" cy="15.5" r="1.5" />
        <circle cx="9.5" cy="21.5" r="1.5" />
      </svg>
      {props.children}
    </Btn>
  )
)
