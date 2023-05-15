import * as React from 'react'
import { css } from 'styled-components'
import {
  TYPOGRAPHY,
  COLORS,
  SPACING,
  BORDERS,
  Btn,
  Flex,
  Icon,
  DIRECTION_ROW,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
} from '@opentrons/components'
import { StyledText } from '../text'
import { ODD_FOCUS_VISIBLE } from './constants'
import type { IconName, StyleProps } from '@opentrons/components'

type SmallButtonTypes =
  | 'alert'
  | 'primary'
  | 'secondary'
  | 'tertiaryLowLight'
  | 'tertiaryHighLight'

export type ButtonCategory = 'default' | 'rounded'

type IconPlacement = 'startIcon' | 'endIcon'
interface SmallButtonProps extends StyleProps {
  onClick: React.MouseEventHandler
  buttonType: SmallButtonTypes
  buttonText: React.ReactNode
  iconPlacement?: IconPlacement
  iconName?: IconName
  buttonCategory?: ButtonCategory // if not specified, it will be 'default'
  disabled?: boolean
}

export function SmallButton(props: SmallButtonProps): JSX.Element {
  const {
    buttonType,
    buttonText,
    buttonCategory = 'default',
    disabled,
    iconPlacement,
    iconName,
    ...buttonProps
  } = props

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
    secondary: {
      defaultColor: COLORS.darkBlackEnabled,
      defaultBackgroundColor: COLORS.mediumBlueEnabled,
      activeBackgroundColor: COLORS.mediumBluePressed,
      disabledBackgroundColor: `${COLORS.darkBlack20}`,
      disabledColor: `${COLORS.darkBlack60}`,
    },
    alert: {
      defaultColor: COLORS.white,
      defaultBackgroundColor: COLORS.red2,
      activeBackgroundColor: COLORS.red2Pressed,
      disabledBackgroundColor: `${COLORS.darkBlack20}`,
      disabledColor: `${COLORS.darkBlack60}`,
    },
    primary: {
      defaultColor: COLORS.white,
      defaultBackgroundColor: COLORS.blueEnabled,
      activeBackgroundColor: COLORS.bluePressed,
      disabledBackgroundColor: `${COLORS.darkBlack20}`,
      disabledColor: `${COLORS.darkBlack60}`,
    },
    tertiaryHighLight: {
      defaultColor: COLORS.darkBlackEnabled,
      defaultBackgroundColor: `${COLORS.blueEnabled}${COLORS.opacity0HexCode}`,
      activeBackgroundColor: `${COLORS.darkBlack20}`,
      disabledBackgroundColor: `${COLORS.blueEnabled}${COLORS.opacity0HexCode}`,
      disabledColor: `${COLORS.darkBlack60}`,
    },
    tertiaryLowLight: {
      defaultColor: `${COLORS.darkBlack70}`,
      defaultBackgroundColor: ` ${COLORS.blueEnabled}${COLORS.opacity0HexCode}`,
      activeBackgroundColor: `${COLORS.darkBlack20}`,
      disabledBackgroundColor: `${COLORS.blueEnabled}${COLORS.opacity0HexCode}`,
      disabledColor: `${COLORS.darkBlack60}`,
    },
  }

  const SMALL_BUTTON_STYLE = css`
    color: ${SMALL_BUTTON_PROPS_BY_TYPE[buttonType].defaultColor};
    background-color: ${SMALL_BUTTON_PROPS_BY_TYPE[buttonType]
      .defaultBackgroundColor};
    cursor: default;
    border-radius: ${buttonCategory === 'rounded'
      ? BORDERS.size5
      : BORDERS.size4};
    box-shadow: none;
    padding: ${SPACING.spacing16} ${SPACING.spacing24};
    ${TYPOGRAPHY.pSemiBold}

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
      box-shadow: ${ODD_FOCUS_VISIBLE};
      background-color: ${SMALL_BUTTON_PROPS_BY_TYPE[buttonType]
        .defaultBackgroundColor};
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
      css={SMALL_BUTTON_STYLE}
      aria-label={`SmallButton_${buttonType}`}
      disabled={disabled}
      {...buttonProps}
    >
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
      >
        {iconPlacement === 'startIcon' && iconName != null ? (
          <Flex aria-label={`SmallButton_${iconName}_positionStart`}>
            <Icon
              size="1.75rem"
              marginRight={SPACING.spacing8}
              name={iconName}
            />
          </Flex>
        ) : null}

        <StyledText
          fontSize="1.375rem"
          lineHeight={TYPOGRAPHY.lineHeight28}
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        >
          {buttonText}
        </StyledText>
        {iconPlacement === 'endIcon' && iconName != null ? (
          <Flex aria-label={`SmallButton_${iconName}_positionEnd`}>
            <Icon
              size="1.75rem"
              marginLeft={SPACING.spacing8}
              name={iconName}
            />
          </Flex>
        ) : null}
      </Flex>
    </Btn>
  )
}
