import * as React from 'react'
import { css } from 'styled-components'
import {
  ALIGN_CENTER,
  BORDERS,
  Btn,
  COLORS,
  DIRECTION_ROW,
  Icon,
  SPACING,
  TYPOGRAPHY,
  DISPLAY_FLEX,
  LEGACY_COLORS,
  JUSTIFY_CENTER,
} from '@opentrons/components'
import { StyledText } from '../text'
import { ODD_FOCUS_VISIBLE } from './constants'

import type { IconName, StyleProps } from '@opentrons/components'
import type { ButtonCategory } from './SmallButton'

type MediumButtonTypes =
  | 'primary'
  | 'secondary'
  | 'alert'
  | 'alertSecondary'
  | 'tertiaryHigh'
  | 'tertiaryLowLight'

interface MediumButtonProps extends StyleProps {
  buttonText: React.ReactNode
  buttonType?: MediumButtonTypes
  disabled?: boolean
  iconName?: IconName
  buttonCategory?: ButtonCategory
  onClick: React.MouseEventHandler
}

export function MediumButton(props: MediumButtonProps): JSX.Element {
  const {
    buttonText,
    buttonType = 'primary',
    disabled = false,
    iconName,
    buttonCategory = 'default',
    ...buttonProps
  } = props

  const MEDIUM_BUTTON_PROPS_BY_TYPE: Record<
    MediumButtonTypes,
    {
      activeBackgroundColor: string
      defaultBackgroundColor: string
      defaultColor: string
      disabledBackgroundColor: string
      iconColor: string
    }
  > = {
    alert: {
      //  TODO(ew, 3/22/23): replaces these hex codes with the color constants
      activeBackgroundColor: '#b91f20',
      defaultBackgroundColor: LEGACY_COLORS.red2,
      defaultColor: LEGACY_COLORS.white,
      disabledBackgroundColor: LEGACY_COLORS.darkBlack20,
      iconColor: LEGACY_COLORS.white,
    },
    alertSecondary: {
      //  TODO(ew, 3/22/23): replaces these hex codes with the color constants
      activeBackgroundColor: '#ccabac',
      defaultBackgroundColor: LEGACY_COLORS.red3,
      defaultColor: LEGACY_COLORS.red1,
      disabledBackgroundColor: LEGACY_COLORS.darkBlack20,
      iconColor: LEGACY_COLORS.red1,
    },
    primary: {
      //  TODO(ew, 3/22/23): replaces these hex codes with the color constants
      activeBackgroundColor: '#045dd0',
      defaultBackgroundColor: COLORS.blue50,
      defaultColor: LEGACY_COLORS.white,
      disabledBackgroundColor: LEGACY_COLORS.darkBlack20,
      iconColor: LEGACY_COLORS.white,
    },
    secondary: {
      //  TODO(ew, 3/22/23): replaces these hex codes with the color constants
      activeBackgroundColor: '#94afd4',
      defaultBackgroundColor: COLORS.blue35,
      defaultColor: LEGACY_COLORS.darkBlackEnabled,
      disabledBackgroundColor: LEGACY_COLORS.darkBlack20,
      iconColor: COLORS.blue50,
    },
    tertiaryHigh: {
      activeBackgroundColor: LEGACY_COLORS.darkBlack20,
      defaultBackgroundColor: LEGACY_COLORS.white,
      defaultColor: LEGACY_COLORS.darkBlack100,
      disabledBackgroundColor: LEGACY_COLORS.transparent,
      iconColor: LEGACY_COLORS.darkBlack100,
    },
    tertiaryLowLight: {
      activeBackgroundColor: LEGACY_COLORS.darkBlack20,
      defaultBackgroundColor: LEGACY_COLORS.white,
      defaultColor: LEGACY_COLORS.darkBlack70,
      disabledBackgroundColor: LEGACY_COLORS.transparent,
      iconColor: LEGACY_COLORS.darkBlack70,
    },
  }

  const MEDIUM_BUTTON_STYLE = css`
    background-color: ${MEDIUM_BUTTON_PROPS_BY_TYPE[buttonType]
      .defaultBackgroundColor};
    border-radius: ${buttonCategory === 'rounded'
      ? BORDERS.borderRadiusSize5
      : BORDERS.borderRadiusSize4};
    box-shadow: none;
    color: ${MEDIUM_BUTTON_PROPS_BY_TYPE[buttonType].defaultColor};
    cursor: default;

    &:focus {
      background-color: ${MEDIUM_BUTTON_PROPS_BY_TYPE[buttonType]
        .defaultBackgroundColor};
      box-shadow: none;
    }
    &:hover {
      background-color: ${MEDIUM_BUTTON_PROPS_BY_TYPE[buttonType]
        .defaultBackgroundColor};
      border: none;
      box-shadow: none;
      color: ${MEDIUM_BUTTON_PROPS_BY_TYPE[buttonType].defaultColor};
    }
    &:focus-visible {
      box-shadow: ${ODD_FOCUS_VISIBLE};
    }

    &:active {
      background-color: ${MEDIUM_BUTTON_PROPS_BY_TYPE[buttonType]
        .activeBackgroundColor};
    }

    &:disabled {
      background-color: ${MEDIUM_BUTTON_PROPS_BY_TYPE[buttonType]
        .disabledBackgroundColor};
      color: ${LEGACY_COLORS.darkBlack60};
    }
  `
  return (
    <Btn
      display={DISPLAY_FLEX}
      disabled={disabled}
      css={MEDIUM_BUTTON_STYLE}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
      flexDirection={DIRECTION_ROW}
      gridGap={SPACING.spacing12}
      padding={
        iconName !== undefined
          ? `${SPACING.spacing20} ${SPACING.spacing24}`
          : `${SPACING.spacing20} ${SPACING.spacing40}`
      }
      {...buttonProps}
    >
      {iconName !== undefined && (
        <Icon
          name={iconName ?? 'play'}
          aria-label={`${iconName ?? 'play'} icon`}
          color={
            disabled
              ? LEGACY_COLORS.darkBlack60
              : MEDIUM_BUTTON_PROPS_BY_TYPE[buttonType].iconColor
          }
          size={SPACING.spacing40}
        />
      )}
      <StyledText
        fontSize={TYPOGRAPHY.fontSize28}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        lineHeight={TYPOGRAPHY.lineHeight36}
      >
        {buttonText}
      </StyledText>
    </Btn>
  )
}
