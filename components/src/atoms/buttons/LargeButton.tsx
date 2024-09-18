import * as React from 'react'
import { css } from 'styled-components'
import { Box, Btn } from '../../primitives'

import { BORDERS, COLORS } from '../../helix-design-system'
import { RESPONSIVENESS, SPACING, TYPOGRAPHY } from '../../ui-style-constants'
import { LegacyStyledText } from '../../atoms/StyledText'
import { fontSizeBodyLargeSemiBold } from '../../helix-design-system/product/typography'
import {
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  JUSTIFY_SPACE_BETWEEN,
} from '../..'
import { Icon } from '../../icons'
import type { StyleProps } from '../../primitives'
import type { IconName } from '../../icons'

type LargeButtonTypes =
  | 'primary'
  | 'secondary'
  | 'alert'
  | 'alertStroke'
  | 'alertAlt'
  | 'stroke'
interface LargeButtonProps extends StyleProps {
  /** used for form submission */
  type?: 'submit'
  onClick?: () => void
  buttonType?: LargeButtonTypes
  buttonText: React.ReactNode
  iconName?: IconName
  disabled?: boolean
  /** aria-disabled for displaying snack bar. */
  ariaDisabled?: boolean
}

export function LargeButton(props: LargeButtonProps): JSX.Element {
  const {
    buttonType = 'primary',
    buttonText,
    iconName,
    ariaDisabled = false,
    disabled = false,
    type,
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
      focusVisibleBackgroundColor: string
      hoverBackgroundColor?: string
      hoverColor?: string
      activeIconColor?: string
      activeColor?: string
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
      focusVisibleBackgroundColor: COLORS.blue40,
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
      focusVisibleBackgroundColor: COLORS.red40,
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
      focusVisibleBackgroundColor: COLORS.blue55,
      hoverBackgroundColor: COLORS.blue55,
      hoverColor: COLORS.white,
    },
    alertStroke: {
      defaultColor: COLORS.white,
      disabledColor: COLORS.grey50,
      activeColor: COLORS.red60,
      defaultBackgroundColor: COLORS.transparent,
      activeBackgroundColor: COLORS.red35,
      disabledBackgroundColor: COLORS.grey35,
      iconColor: COLORS.white,
      disabledIconColor: COLORS.grey50,
      activeIconColor: COLORS.red60,
      focusVisibleOutlineColor: COLORS.blue50,
      focusVisibleBackgroundColor: COLORS.red40,
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
      focusVisibleBackgroundColor: COLORS.red40,
    },
    stroke: {
      defaultColor: COLORS.blue50,
      disabledColor: COLORS.grey50,
      defaultBackgroundColor: COLORS.white,
      activeBackgroundColor: COLORS.white,
      disabledBackgroundColor: COLORS.white,
      iconColor: COLORS.blue50,
      disabledIconColor: COLORS.grey40,
      focusVisibleOutlineColor: COLORS.blue55,
      focusVisibleBackgroundColor: COLORS.blue55,
      hoverBackgroundColor: COLORS.white,
      hoverColor: COLORS.blue55,
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
    color: ${LARGE_BUTTON_PROPS_BY_TYPE[buttonType].defaultColor};
    background-color: ${
      LARGE_BUTTON_PROPS_BY_TYPE[buttonType].defaultBackgroundColor
    };
    cursor: pointer;
    padding: ${SPACING.spacing16} ${SPACING.spacing24};
    text-align: ${TYPOGRAPHY.textAlignCenter};
    border-radius: ${BORDERS.borderRadiusFull};
    align-items: ${ALIGN_CENTER};
    border: ${buttonType === 'stroke' ? `2px solid ${COLORS.blue50}` : 'none'};

    &:active {
      background-color: ${
        LARGE_BUTTON_PROPS_BY_TYPE[buttonType].activeBackgroundColor
      };
      ${activeColorFor(buttonType)};
    }
    &:active #btn-icon {
      ${activeIconStyle(buttonType)};
    }

    &:hover {
      color: ${LARGE_BUTTON_PROPS_BY_TYPE[buttonType].hoverColor};
      background-color: ${
        LARGE_BUTTON_PROPS_BY_TYPE[buttonType].hoverBackgroundColor
      };

      border: ${
        buttonType === 'stroke' ? `2px solid ${COLORS.blue55}` : 'none'
      };
    }

    &:focus-visible {
      outline: 2px solid ${COLORS.blue55};
    }

    &:disabled {
      color: ${LARGE_BUTTON_PROPS_BY_TYPE[buttonType].disabledColor};
      background-color: ${
        LARGE_BUTTON_PROPS_BY_TYPE[buttonType].disabledBackgroundColor
      };
    }

    &[aria-disabled='true'] {
      color: ${LARGE_BUTTON_PROPS_BY_TYPE[buttonType].disabledColor};
      background-color: ${
        LARGE_BUTTON_PROPS_BY_TYPE[buttonType].disabledBackgroundColor
      };
    }

    @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
      cursor: default;
      align-items: ${ALIGN_FLEX_START};
      flex-direction: ${DIRECTION_COLUMN};
      border-radius: ${BORDERS.borderRadius16};
      box-shadow: none;
      padding: ${SPACING.spacing24};
      line-height: ${TYPOGRAPHY.lineHeight20};
      gap: ${SPACING.spacing60};
      outline: ${BORDERS.borderRadius4} solid
        ${
          buttonType === 'alertStroke' && !disabled
            ? LARGE_BUTTON_PROPS_BY_TYPE[buttonType].defaultColor
            : 'none'
        };

      ${TYPOGRAPHY.pSemiBold}

      #btn-icon: {
        color: ${
          disabled
            ? LARGE_BUTTON_PROPS_BY_TYPE[buttonType].disabledIconColor
            : LARGE_BUTTON_PROPS_BY_TYPE[buttonType].iconColor
        };
      }

      &:active {
        background-color: ${
          disabled
            ? LARGE_BUTTON_PROPS_BY_TYPE[buttonType].disabledBackgroundColor
            : LARGE_BUTTON_PROPS_BY_TYPE[buttonType].activeBackgroundColor
        };
        ${!disabled && activeColorFor(buttonType)};
        outline: ${BORDERS.borderRadius4} solid
          ${
            disabled
              ? LARGE_BUTTON_PROPS_BY_TYPE[buttonType].disabledBackgroundColor
              : LARGE_BUTTON_PROPS_BY_TYPE[buttonType].activeBackgroundColor
          };
      }
      &:active #btn-icon {
        ${activeIconStyle(buttonType)};
      }

      &:focus-visible {
        background-color: ${
          disabled
            ? LARGE_BUTTON_PROPS_BY_TYPE[buttonType].disabledBackgroundColor
            : LARGE_BUTTON_PROPS_BY_TYPE[buttonType].focusVisibleBackgroundColor
        };
        ${!disabled && activeColorFor(buttonType)};
        padding: calc(${SPACING.spacing24} + ${SPACING.spacing2});
        border: ${SPACING.spacing2} solid ${COLORS.transparent};
        outline: ${
          disabled
            ? 'none'
            : `3px solid
    ${LARGE_BUTTON_PROPS_BY_TYPE[buttonType].focusVisibleOutlineColor}`
        };
        background-clip: padding-box;
        box-shadow: none;
      }

      &:disabled {
        color: ${LARGE_BUTTON_PROPS_BY_TYPE[buttonType].disabledColor};
        background-color: ${
          LARGE_BUTTON_PROPS_BY_TYPE[buttonType].disabledBackgroundColor
        };
      }
  `
  return (
    <Btn
      type={type}
      display={DISPLAY_FLEX}
      css={LARGE_BUTTON_STYLE}
      disabled={ariaDisabled ? false : disabled}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      aria-disabled={ariaDisabled}
      {...buttonProps}
    >
      <LegacyStyledText
        css={css`
          font-size: ${fontSizeBodyLargeSemiBold};
          padding-right: ${iconName != null ? SPACING.spacing8 : '0'};
          @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
            ${TYPOGRAPHY.level3HeaderSemiBold}
          }
        `}
      >
        {buttonText}
      </LegacyStyledText>
      {iconName ? (
        <Box
          css={css`
            width: 1.5rem;
            height: 1.5rem;
            @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
              width: 5rem;
              height: 5rem;
            }
          `}
        >
          <Icon name={iconName} aria-label={`${iconName} icon`} id="btn-icon" />
        </Box>
      ) : null}
    </Btn>
  )
}
