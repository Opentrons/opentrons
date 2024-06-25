import * as React from 'react'
import { css } from 'styled-components'
import {
  BORDERS,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  Icon,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import type { IconName, StyleProps } from '@opentrons/components'

type LargeButtonTypes =
  | 'primary'
  | 'secondary'
  | 'alert'
  | 'alertStroke'
  | 'alertAlt'
interface LargeButtonProps extends StyleProps {
  onClick: () => void
  buttonType?: LargeButtonTypes
  buttonText: React.ReactNode
  iconName?: IconName
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
      disabledBackgroundColor: string
      defaultColor: string
      disabledColor: string
      iconColor: string
      disabledIconColor: string
      focusVisibleOutlineColor: string
      isInverse?: boolean
      activeColor?: string
      activeIconColor?: string
    }
  > = {
    secondary: {
      defaultColor: COLORS.black90,
      disabledColor: COLORS.grey50,
      defaultBackgroundColor: COLORS.blue35,
      activeBackgroundColor: COLORS.blue40,
      disabledBackgroundColor: COLORS.grey35,
      iconColor: COLORS.blue50,
      disabledIconColor: COLORS.grey50,
      focusVisibleOutlineColor: COLORS.blue50,
    },
    alert: {
      defaultColor: COLORS.red60,
      disabledColor: COLORS.grey50,
      defaultBackgroundColor: COLORS.red35,
      activeBackgroundColor: COLORS.red40,
      disabledBackgroundColor: COLORS.grey35,
      iconColor: COLORS.red60,
      disabledIconColor: COLORS.grey50,
      focusVisibleOutlineColor: COLORS.blue50,
    },
    primary: {
      defaultColor: COLORS.white,
      disabledColor: COLORS.grey50,
      defaultBackgroundColor: COLORS.blue50,
      activeBackgroundColor: COLORS.blue60,
      disabledBackgroundColor: COLORS.grey35,
      iconColor: COLORS.white,
      disabledIconColor: COLORS.grey50,
      focusVisibleOutlineColor: COLORS.blue55,
    },
    alertStroke: {
      defaultColor: COLORS.white,
      disabledColor: COLORS.grey40,
      activeColor: COLORS.red60,
      defaultBackgroundColor: COLORS.transparent,
      activeBackgroundColor: COLORS.red35,
      disabledBackgroundColor: COLORS.transparent,
      iconColor: COLORS.white,
      disabledIconColor: COLORS.grey40,
      isInverse: true,
      activeIconColor: COLORS.red60,
      focusVisibleOutlineColor: COLORS.blue50,
    },
    alertAlt: {
      defaultColor: COLORS.red50,
      disabledColor: COLORS.grey50,
      defaultBackgroundColor: COLORS.white,
      activeBackgroundColor: COLORS.red35,
      disabledBackgroundColor: COLORS.grey35,
      iconColor: COLORS.red50,
      disabledIconColor: COLORS.grey50,
      activeIconColor: COLORS.red60,
      activeColor: COLORS.red60,
      focusVisibleOutlineColor: COLORS.blue50,
    },
  }
  const activeColorFor = (
    style: keyof typeof LARGE_BUTTON_PROPS_BY_TYPE
  ): string =>
    LARGE_BUTTON_PROPS_BY_TYPE[style].activeColor
      ? `color: ${LARGE_BUTTON_PROPS_BY_TYPE[style].activeColor}`
      : ''
  const activeIconStyle = (
    style: keyof typeof LARGE_BUTTON_PROPS_BY_TYPE
  ): string =>
    LARGE_BUTTON_PROPS_BY_TYPE[style].activeIconColor
      ? `color: ${LARGE_BUTTON_PROPS_BY_TYPE[style].activeIconColor}`
      : ''
  const LARGE_BUTTON_STYLE = css`
    text-align: ${TYPOGRAPHY.textAlignLeft};
    color: ${LARGE_BUTTON_PROPS_BY_TYPE[buttonType].defaultColor};
    background-color: ${LARGE_BUTTON_PROPS_BY_TYPE[buttonType]
      .defaultBackgroundColor};
    cursor: default;
    border-radius: ${BORDERS.borderRadius16};
    box-shadow: none;
    padding: ${SPACING.spacing24};
    line-height: ${TYPOGRAPHY.lineHeight20};
    border: ${BORDERS.borderRadius4} solid
      ${!!LARGE_BUTTON_PROPS_BY_TYPE[buttonType].isInverse
        ? LARGE_BUTTON_PROPS_BY_TYPE[buttonType].color
        : LARGE_BUTTON_PROPS_BY_TYPE[buttonType].defaultBackgroundColor};

    ${TYPOGRAPHY.pSemiBold}

    #btn-icon: {
      color: ${disabled
        ? LARGE_BUTTON_PROPS_BY_TYPE[buttonType].disabledIconColor
        : LARGE_BUTTON_PROPS_BY_TYPE[buttonType].iconColor};
    }

    &:active {
      background-color: ${LARGE_BUTTON_PROPS_BY_TYPE[buttonType]
        .activeBackgroundColor};
      ${activeColorFor(buttonType)};
      border: ${BORDERS.borderRadius4} solid
        ${LARGE_BUTTON_PROPS_BY_TYPE[buttonType].activeBackgroundColor};
    }
    &:active #btn-icon {
      ${activeIconStyle(buttonType)};
    }

    &:focus-visible {
      background-color: ${LARGE_BUTTON_PROPS_BY_TYPE[buttonType]
        .activeBackgroundColor};
      ${activeColorFor(buttonType)};
      padding: calc(${SPACING.spacing24} + ${SPACING.spacing2});
      border: ${SPACING.spacing2} solid ${COLORS.transparent};
      outline: 3px solid
        ${LARGE_BUTTON_PROPS_BY_TYPE[buttonType].focusVisibleOutlineColor};
      background-clip: padding-box;
      box-shadow: none;
    }

    &:disabled {
      color: ${LARGE_BUTTON_PROPS_BY_TYPE[buttonType].disabledColor};
      background-color: ${LARGE_BUTTON_PROPS_BY_TYPE[buttonType]
        .disabledBackgroundColor};
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
      <Flex flexDirection={DIRECTION_COLUMN}>
        <LegacyStyledText css={TYPOGRAPHY.level3HeaderSemiBold}>
          {buttonText}
        </LegacyStyledText>
      </Flex>
      {iconName ? (
        <Icon
          name={iconName}
          aria-label={`${iconName} icon`}
          size="5rem"
          id={`btn-icon`}
        />
      ) : null}
    </Btn>
  )
}
