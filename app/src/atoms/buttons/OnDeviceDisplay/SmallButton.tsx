import * as React from 'react'
import { css } from 'styled-components'
import {
  TYPOGRAPHY,
  COLORS,
  SPACING,
  BORDERS,
  Btn,
  styleProps,
} from '@opentrons/components'
import { ODD_FOCUS_VISIBLE_STYE } from '../../../App/constants'
import { StyledText } from '../../text'
import type { StyleProps } from '@opentrons/components'

type SmallButtonTypes =
  | 'alt'
  | 'alert'
  | 'default'
  | 'tertiaryLowLight'
  | 'tertiaryHighLight'
interface SmallButtonProps extends StyleProps {
  onClick: () => void
  buttonType: SmallButtonTypes
  buttonText: React.ReactNode
  disabled?: boolean
}

export function SmallButton(props: SmallButtonProps): JSX.Element {
  const { onClick, buttonType, buttonText, disabled } = props
  const buttonProps = {
    onClick,
    disabled,
  }

  const SMALL_BUTTON_PROPS_BY_TYPE: Record<
    SmallButtonTypes,
    {
      defaultBackgroundColor: string
      activeBackgroundColor: string
      disabledBackgroundColor: string
      disabledColor: string
      defaultColor: string
    }
  > = {
    alt: {
      defaultColor: COLORS.darkBlackEnabled,
      defaultBackgroundColor: COLORS.foundationalBlue,
      //  TODO(jr, 3/14/23): replaces these hex codes with the color constants
      activeBackgroundColor: '#99b1d2',
      disabledBackgroundColor: `${COLORS.darkBlack_twenty}`,
      disabledColor: `${COLORS.darkBlackEnabled}${COLORS.opacity55HexCode}`,
    },
    alert: {
      defaultColor: COLORS.white,
      defaultBackgroundColor: COLORS.red_two,
      activeBackgroundColor: '#ab302a',
      disabledBackgroundColor: `${COLORS.darkBlack_twenty}`,
      disabledColor: `${COLORS.darkBlackEnabled}${COLORS.opacity55HexCode}`,
    },
    default: {
      defaultColor: COLORS.white,
      defaultBackgroundColor: COLORS.blueEnabled,
      activeBackgroundColor: '#2160ca',
      disabledBackgroundColor: `${COLORS.darkBlack_twenty}`,
      disabledColor: `${COLORS.darkBlackEnabled}${COLORS.opacity55HexCode}`,
    },
    tertiaryHighLight: {
      defaultColor: `${COLORS.darkBlack_seventy}`,
      defaultBackgroundColor: `${COLORS.blueEnabled}${COLORS.opacity0HexCode}`,
      activeBackgroundColor: `${COLORS.darkBlack_twenty}`,
      disabledBackgroundColor: `${COLORS.blueEnabled}${COLORS.opacity0HexCode}`,
      disabledColor: `${COLORS.darkBlackEnabled}${COLORS.opacity55HexCode}`,
    },
    tertiaryLowLight: {
      defaultColor: COLORS.darkBlackEnabled,
      defaultBackgroundColor: ` ${COLORS.blueEnabled}${COLORS.opacity0HexCode}`,
      activeBackgroundColor: `${COLORS.darkBlack_twenty}`,
      disabledBackgroundColor: `${COLORS.blueEnabled}${COLORS.opacity0HexCode}`,
      disabledColor: `${COLORS.darkBlackEnabled}${COLORS.opacity55HexCode}`,
    },
  }

  const SMALL_BUTTON_STYLE = css`
    color: ${SMALL_BUTTON_PROPS_BY_TYPE[buttonType].defaultColor};
    background-color: ${SMALL_BUTTON_PROPS_BY_TYPE[buttonType]
      .defaultBackgroundColor};
    cursor: default;
    border-radius: ${BORDERS.size_four};
    box-shadow: none;
    padding: ${SPACING.spacing4} ${SPACING.spacing5};
    text-transform: ${TYPOGRAPHY.textTransformNone};
    ${TYPOGRAPHY.pSemiBold}

    ${styleProps}
    &:focus {
      background-color: ${SMALL_BUTTON_PROPS_BY_TYPE[buttonType]
        .activeBackgroundColor};
      box-shadow: none;
    }
    &:hover {
      border: none;
      box-shadow: none;
      background-color: ${SMALL_BUTTON_PROPS_BY_TYPE[buttonType]
        .defaultBackgroundColor};
      color: ${SMALL_BUTTON_PROPS_BY_TYPE[buttonType].defaultColor};
    }
    &:focus-visible {
      box-shadow: ${ODD_FOCUS_VISIBLE_STYE};
    }

    &:active {
      background-color: ${SMALL_BUTTON_PROPS_BY_TYPE[buttonType]
        .activeBackgroundColor};
    }

    &:disabled {
      background-color: ${SMALL_BUTTON_PROPS_BY_TYPE[buttonType]
        .disabledBackgroundColor};
      color: ${SMALL_BUTTON_PROPS_BY_TYPE[buttonType].disabledColor};
    }
  `

  return (
    <Btn
      {...buttonProps}
      css={SMALL_BUTTON_STYLE}
      aria-label={`SmallButton_${buttonType}`}
    >
      <StyledText
        fontSize="1.375rem"
        lineHeight={TYPOGRAPHY.lineHeight28}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
      >
        {buttonText}
      </StyledText>
    </Btn>
  )
}
