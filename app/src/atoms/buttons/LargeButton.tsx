import * as React from 'react'
import { css } from 'styled-components'
import {
  TYPOGRAPHY,
  LEGACY_COLORS,
  SPACING,
  BORDERS,
  Btn,
  Icon,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  DISPLAY_FLEX,
  COLORS,
} from '@opentrons/components'
import { StyledText } from '../text'
import { ODD_FOCUS_VISIBLE } from './constants'
import type { IconName, StyleProps } from '@opentrons/components'

type LargeButtonTypes = 'primary' | 'secondary' | 'alert'
interface LargeButtonProps extends StyleProps {
  onClick: () => void
  buttonType?: LargeButtonTypes
  buttonText: React.ReactNode
  iconName: IconName
  disabled?: boolean
}

export function LargeButton(props: LargeButtonProps): JSX.Element {
  const {
    buttonType = 'primary',
    buttonText,
    iconName,
    disabled = false,
    ...buttonProps
  } = props

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
      defaultColor: LEGACY_COLORS.darkBlackEnabled,
      defaultBackgroundColor: COLORS.blue35,
      activeBackgroundColor: COLORS.blue40,
      iconColor: COLORS.blue50,
    },
    alert: {
      defaultColor: LEGACY_COLORS.red1,
      defaultBackgroundColor: LEGACY_COLORS.red3,
      activeBackgroundColor: LEGACY_COLORS.red3Pressed,
      iconColor: LEGACY_COLORS.red1,
    },
    primary: {
      defaultColor: LEGACY_COLORS.white,
      defaultBackgroundColor: COLORS.blue50,
      activeBackgroundColor: COLORS.blue60,
      iconColor: LEGACY_COLORS.white,
    },
  }

  const LARGE_BUTTON_STYLE = css`
    text-align: ${TYPOGRAPHY.textAlignLeft};
    color: ${LARGE_BUTTON_PROPS_BY_TYPE[buttonType].defaultColor};
    background-color: ${LARGE_BUTTON_PROPS_BY_TYPE[buttonType]
      .defaultBackgroundColor};
    cursor: default;
    border-radius: ${BORDERS.borderRadiusSize4};
    box-shadow: none;
    padding: ${SPACING.spacing24};
    line-height: ${TYPOGRAPHY.lineHeight20};
    ${TYPOGRAPHY.pSemiBold}

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
      box-shadow: ${ODD_FOCUS_VISIBLE};
      background-color: ${LARGE_BUTTON_PROPS_BY_TYPE[buttonType]
        .defaultBackgroundColor};
    }
    &:active {
      background-color: ${LARGE_BUTTON_PROPS_BY_TYPE[buttonType]
        .activeBackgroundColor};
    }

    &:disabled {
      background-color: ${LEGACY_COLORS.darkBlack20};
      color: ${LEGACY_COLORS.darkBlack60};
    }
  `
  return (
    <Btn
      display={DISPLAY_FLEX}
      css={LARGE_BUTTON_STYLE}
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      disabled={disabled}
      {...buttonProps}
    >
      <StyledText
        fontSize="2rem"
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        lineHeight="2.625rem"
      >
        {buttonText}
      </StyledText>
      <Icon
        name={iconName}
        aria-label={`${iconName} icon`}
        color={
          disabled
            ? LEGACY_COLORS.darkBlack60
            : LARGE_BUTTON_PROPS_BY_TYPE[buttonType].iconColor
        }
        size="5rem"
      />
    </Btn>
  )
}
