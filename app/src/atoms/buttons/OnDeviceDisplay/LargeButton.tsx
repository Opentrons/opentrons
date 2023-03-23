import * as React from 'react'
import { css } from 'styled-components'
import {
  TYPOGRAPHY,
  COLORS,
  SPACING,
  BORDERS,
  NewPrimaryBtn,
  styleProps,
  DIRECTION_ROW,
  Icon,
} from '@opentrons/components'
import { StyledText } from '../../text'
import type { IconName, StyleProps } from '@opentrons/components'

type LargeButtonTypes = 'primary' | 'secondary' | 'alert'
interface LargeButtonProps extends StyleProps {
  onClick: () => void
  buttonType: LargeButtonTypes
  buttonText: React.ReactNode
  iconName?: IconName
  disabled?: boolean
}

export function LargeButton(props: LargeButtonProps): JSX.Element {
  const { onClick, buttonType, buttonText, iconName, disabled } = props
  const buttonProps = {
    onClick,
    disabled,
  }

  const LARGE_BUTTON_PROPS_BY_TYPE: Record<
    LargeButtonTypes,
    {
      defaultBackgroundColor: string
      activeBackgroundColor: string
      defaultColor: string
      iconColor: string
    }
  > = {
    secondary: {
      defaultColor: COLORS.darkBlackEnabled,
      defaultBackgroundColor: COLORS.foundationalBlue,
      //  TODO(jr, 3/20/23): replace these hex codes with the color constants
      activeBackgroundColor: '#99b1d2',
      iconColor: COLORS.blueEnabled,
    },
    alert: {
      defaultColor: COLORS.red_one,
      defaultBackgroundColor: COLORS.red_three,
      activeBackgroundColor: '#c8acad',
      iconColor: COLORS.red_one,
    },
    primary: {
      defaultColor: COLORS.white,
      defaultBackgroundColor: COLORS.blueEnabled,
      activeBackgroundColor: '#2160ca',
      iconColor: COLORS.white,
    },
  }

  const LARGE_BUTTON_STYLE = css`
    text-align: ${TYPOGRAPHY.textAlignLeft};
    color: ${LARGE_BUTTON_PROPS_BY_TYPE[buttonType].defaultColor};
    background-color: ${LARGE_BUTTON_PROPS_BY_TYPE[buttonType]
      .defaultBackgroundColor};
    cursor: default;
    border-radius: ${BORDERS.size_four};
    box-shadow: none;
    padding: ${SPACING.spacing5} ${SPACING.spacing5} 2.4375rem;
    line-height: ${TYPOGRAPHY.lineHeight20};
    text-transform: ${TYPOGRAPHY.textTransformNone};
    ${TYPOGRAPHY.pSemiBold}

    ${styleProps}
    &:focus {
      background-color: ${LARGE_BUTTON_PROPS_BY_TYPE[buttonType]
        .activeBackgroundColor};
      box-shadow: none;
    }
    &:hover {
      border: none;
      box-shadow: none;
      background-color: ${LARGE_BUTTON_PROPS_BY_TYPE[buttonType]
        .defaultBackgroundColor};
      color: ${LARGE_BUTTON_PROPS_BY_TYPE[buttonType].defaultColor};
    }
    &:focus-visible {
      box-shadow: 0 0 0 ${SPACING.spacingS} ${COLORS.fundamentalsFocus};
    }

    &:active {
      background-color: ${LARGE_BUTTON_PROPS_BY_TYPE[buttonType]
        .activeBackgroundColor};
    }

    &:disabled {
      background-color: ${COLORS.darkBlack_twenty};
      color: ${COLORS.darkBlackEnabled}${COLORS.opacity55HexCode};
    }
  `
  return (
    <NewPrimaryBtn
      {...buttonProps}
      css={LARGE_BUTTON_STYLE}
      aria-label={`LargeButton_${buttonType}`}
      flexDirection={DIRECTION_ROW}
    >
      <StyledText
        fontSize="2rem"
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        paddingBottom="4.6875rem"
        lineHeight="2.625rem"
      >
        {buttonText}
      </StyledText>
      <Icon
        name={iconName ?? 'play'}
        aria-label={`LargeButton_${iconName ?? 'play'}`}
        color={
          disabled
            ? COLORS.darkBlack_sixty
            : LARGE_BUTTON_PROPS_BY_TYPE[buttonType].iconColor
        }
        width="1.875rem"
        height="1.875rem"
      />
    </NewPrimaryBtn>
  )
}
