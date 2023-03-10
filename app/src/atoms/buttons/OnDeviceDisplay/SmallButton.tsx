import * as React from 'react'
import { css } from 'styled-components'
import {
  TYPOGRAPHY,
  COLORS,
  SPACING,
  BORDERS,
  NewPrimaryBtn,
  styleProps,
} from '@opentrons/components'
import { StyledText } from '../../text'
import type { StyleProps } from '@opentrons/components'

type SmallButtonTypes = 'alt' | 'alert' | 'default' | 'ghostHigh' | 'ghostLow'
interface SmallButtonProps extends StyleProps {
  onClick: () => void
  buttonType: SmallButtonTypes
  buttonText: React.ReactNode
  disabled?: boolean
  //  optional text color for the 2 ghostHigh options
  textColor?: string
}

export function SmallButton(props: SmallButtonProps): JSX.Element {
  const { onClick, buttonType, buttonText, textColor, disabled } = props
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
      activeBackgroundColor: COLORS.foundationalBlue_darkBlackEnabled_20,
      disabledBackgroundColor: `${COLORS.darkBlackEnabled}${COLORS.opacity20HexCode}`,
      disabledColor: `${COLORS.darkBlackEnabled}${COLORS.opacity55HexCode}`,
    },
    alert: {
      defaultColor: COLORS.white,
      defaultBackgroundColor: COLORS.errorEnabled,
      activeBackgroundColor: COLORS.errorEnabled_darkBlackEnabled_20,
      disabledBackgroundColor: `${COLORS.darkBlackEnabled}${COLORS.opacity20HexCode}`,
      disabledColor: `${COLORS.darkBlackEnabled}${COLORS.opacity55HexCode}`,
    },
    default: {
      defaultColor: COLORS.white,
      defaultBackgroundColor: COLORS.blueEnabled,
      activeBackgroundColor: COLORS.blueEnabled_darkBlackEnabled_20,
      disabledBackgroundColor: `${COLORS.darkBlackEnabled}${COLORS.opacity20HexCode}`,
      disabledColor: `${COLORS.darkBlackEnabled}${COLORS.opacity55HexCode}`,
    },
    ghostLow: {
      defaultColor: `${COLORS.darkBlackEnabled}${COLORS.opacity70HexCode}`,
      defaultBackgroundColor: `${COLORS.blueEnabled}${COLORS.opacity0HexCode}`,
      activeBackgroundColor: `${COLORS.darkBlackEnabled}${COLORS.opacity20HexCode}`,
      disabledBackgroundColor: `${COLORS.blueEnabled}${COLORS.opacity0HexCode}`,
      disabledColor: `${COLORS.darkBlackEnabled}${COLORS.opacity55HexCode}`,
    },
    ghostHigh: {
      defaultColor: textColor ?? COLORS.blueEnabled,
      defaultBackgroundColor: ` ${COLORS.blueEnabled}${COLORS.opacity0HexCode}`,
      activeBackgroundColor: `${COLORS.darkBlackEnabled}${COLORS.opacity20HexCode}`,
      disabledBackgroundColor: `${COLORS.blueEnabled}${COLORS.opacity0HexCode}`,
      disabledColor: `${COLORS.darkBlackEnabled}${COLORS.opacity55HexCode}`,
    },
  }

  const SMALL_BUTTON_STYLE = css`
    color: ${SMALL_BUTTON_PROPS_BY_TYPE[buttonType].defaultColor};
    background-color: ${SMALL_BUTTON_PROPS_BY_TYPE[buttonType]
      .defaultBackgroundColor};
    cursor: default;
    border-radius: ${BORDERS.size_three};
    box-shadow: none;
    padding-left: ${SPACING.spacing4};
    padding-right: ${SPACING.spacing4};
    line-height: ${TYPOGRAPHY.lineHeight20};
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
      box-shadow: 0 0 0 3px ${COLORS.fundamentalsFocus};
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
    <NewPrimaryBtn
      {...buttonProps}
      css={SMALL_BUTTON_STYLE}
      aria-label={`SmallButton_${buttonType}`}
    >
      <StyledText
        fontSize="1.375rem"
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        padding={SPACING.spacing4}
      >
        {buttonText}
      </StyledText>
    </NewPrimaryBtn>
  )
}
