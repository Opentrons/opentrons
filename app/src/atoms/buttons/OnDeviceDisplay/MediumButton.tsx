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
} from '@opentrons/components'
import { StyledText } from '../../text'
import type { StyleProps } from '@opentrons/components'

type MediumButtonTypes =
  | 'primary'
  | 'secondary'
  | 'alert'
  | 'alertSecondary'
  | 'tertiary'
  | 'tertiaryLight'
interface MediumButtonProps extends StyleProps {
  onClick: () => void
  buttonType?: MediumButtonTypes
  buttonText: React.ReactNode
  disabled?: boolean
}

export function MediumButton(props: MediumButtonProps): JSX.Element {
  const { onClick, buttonType = 'primary', buttonText, disabled = false } = props
  const buttonProps = {
    onClick,
    disabled,
  }

  const MEDIUM_BUTTON_PROPS_BY_TYPE: Record<
    MediumButtonTypes,
    {
      defaultBackgroundColor: string
      activeBackgroundColor: string
      defaultColor: string
    }
  > = {
    alert: {
      defaultColor: COLORS.white,
      defaultBackgroundColor: COLORS.red_two,
      activeBackgroundColor: '#b91f20',
    },
    alertSecondary: {
      defaultColor: COLORS.red_one,
      defaultBackgroundColor: COLORS.red_three,
      activeBackgroundColor: '#ccabac',
    },
    primary: {
      defaultColor: COLORS.white,
      defaultBackgroundColor: COLORS.blueEnabled,
      activeBackgroundColor: '#045dd0',
    },
    secondary: {
      defaultColor: COLORS.darkBlackEnabled,
      defaultBackgroundColor: COLORS.foundationalBlue,
      activeBackgroundColor: '#94afd4',
    },
    tertiary: {
      defaultColor: COLORS.darkBlack_hundred,
      defaultBackgroundColor: COLORS.white,
      activeBackgroundColor: COLORS.darkBlack_twenty,
    },
    tertiaryLight: {
      defaultColor: COLORS.darkBlack_seventy,
      defaultBackgroundColor: COLORS.white,
      activeBackgroundColor: COLORS.darkBlack_twenty,
    },
  }

  const MEDIUM_BUTTON_STYLE = css`
    background-color: ${MEDIUM_BUTTON_PROPS_BY_TYPE[buttonType]
      .defaultBackgroundColor};
    border-radius: ${BORDERS.size_four};
    box-shadow: none;
    color: ${MEDIUM_BUTTON_PROPS_BY_TYPE[buttonType].defaultColor};
    cursor: default;
    padding: ${SPACING.spacingM} ${SPACING.spacingXXL};
    text-align: ${TYPOGRAPHY.textAlignLeft};
    text-transform: ${TYPOGRAPHY.textTransformNone};

    ${styleProps}

    &:focus {
      background-color: ${MEDIUM_BUTTON_PROPS_BY_TYPE[buttonType]
        .defaultBackgroundColor};
      box-shadow: none;
    }
    &:hover {
      border: none;
      box-shadow: none;
      background-color: ${MEDIUM_BUTTON_PROPS_BY_TYPE[buttonType]
        .defaultBackgroundColor};
      color: ${MEDIUM_BUTTON_PROPS_BY_TYPE[buttonType].defaultColor};
    }
    &:focus-visible {
      box-shadow: 0 0 0 ${SPACING.spacingS} ${COLORS.fundamentalsFocus};
    }

    &:active {
      background-color: ${MEDIUM_BUTTON_PROPS_BY_TYPE[buttonType]
        .activeBackgroundColor};
    }

    &:disabled {
      background-color: ${COLORS.darkBlack_twenty};
      color: ${COLORS.darkBlack_sixty};
    }
  `
  return (
    <NewPrimaryBtn
      {...buttonProps}
      css={MEDIUM_BUTTON_STYLE}
      aria-label={`MediumButton_${buttonType}`}
      flexDirection={DIRECTION_ROW}
    >
      <StyledText
        fontSize={TYPOGRAPHY.fontSize28}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        lineHeight={TYPOGRAPHY.lineHeight36}
      >
        {buttonText}
      </StyledText>
    </NewPrimaryBtn>
  )
}
