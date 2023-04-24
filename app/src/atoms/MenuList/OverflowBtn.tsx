import * as React from 'react'
import { css } from 'styled-components'
import { Btn, COLORS, Icon, SPACING } from '@opentrons/components'
import { ODD_FOCUS_VISIBLE } from '../buttons/OnDeviceDisplay/constants'

interface OverflowBtnProps extends React.ComponentProps<typeof Btn> {
  /** optional boolean to specify if button is being rendered on touchscreen or not */
  isOnDevice?: boolean
}
//  TODO(jr 4/13/23): should probably move this component to atoms/buttons
export const OverflowBtn = React.forwardRef(
  (
    props: OverflowBtnProps,
    ref: React.ForwardedRef<HTMLInputElement>
  ): JSX.Element => {
    const { isOnDevice = false } = props
    return (
      <Btn
        css={css`
          border-radius: ${SPACING.spacing2};
          max-height: ${isOnDevice ? '100%' : SPACING.spacing6};

          &:hover {
            background-color: ${props.isOnDevice
              ? COLORS.darkBlack_twenty
              : COLORS.lightGreyHover};
          }
          &:hover circle {
            fill: ${COLORS.darkBlackEnabled};
          }

          &:active,
          &:focus {
            background-color: ${props.isOnDevice
              ? COLORS.darkBlack_twenty
              : COLORS.lightGreyPressed};
          }

          &:active circle,
          &:focus circle {
            fill: ${COLORS.darkGreyPressed};
          }

          &:focus-visible {
            box-shadow: ${props.isOnDevice
              ? ODD_FOCUS_VISIBLE
              : `0 0 0 3px ${COLORS.warningEnabled}`};
            background-color: ${props.isOnDevice
              ? COLORS.darkBlack_twenty
              : 'transparent'};
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
        `}
        {...props}
        ref={ref}
      >
        {Boolean(isOnDevice) ? (
          <Icon
            name="overflow-btn-touchscreen"
            height="48.23px"
            width="40px"
            color={COLORS.darkBlack_seventy}
            aria-label="OverflowBtn_OnDeviceDisplay_icon"
          />
        ) : (
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
        )}
        {props?.children != null ? props.Children : null}
      </Btn>
    )
  }
)
