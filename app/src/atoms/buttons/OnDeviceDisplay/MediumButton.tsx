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
} from '@opentrons/components'
import { StyledText } from '../../text'
import type { IconName, StyleProps } from '@opentrons/components'

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
  onClick: React.MouseEventHandler
}

export function MediumButton(props: MediumButtonProps): JSX.Element {
  const {
    buttonText,
    buttonType = 'primary',
    disabled = false,
    iconName,
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
      defaultBackgroundColor: COLORS.red_two,
      defaultColor: COLORS.white,
      disabledBackgroundColor: COLORS.darkBlack_twenty,
      iconColor: COLORS.white,
    },
    alertSecondary: {
      //  TODO(ew, 3/22/23): replaces these hex codes with the color constants
      activeBackgroundColor: '#ccabac',
      defaultBackgroundColor: COLORS.red_three,
      defaultColor: COLORS.red_one,
      disabledBackgroundColor: COLORS.darkBlack_twenty,
      iconColor: COLORS.red_one,
    },
    primary: {
      //  TODO(ew, 3/22/23): replaces these hex codes with the color constants
      activeBackgroundColor: '#045dd0',
      defaultBackgroundColor: COLORS.blueEnabled,
      defaultColor: COLORS.white,
      disabledBackgroundColor: COLORS.darkBlack_twenty,
      iconColor: COLORS.white,
    },
    secondary: {
      //  TODO(ew, 3/22/23): replaces these hex codes with the color constants
      activeBackgroundColor: '#94afd4',
      defaultBackgroundColor: COLORS.foundationalBlue,
      defaultColor: COLORS.darkBlackEnabled,
      disabledBackgroundColor: COLORS.darkBlack_twenty,
      iconColor: COLORS.blueEnabled,
    },
    tertiaryHigh: {
      activeBackgroundColor: COLORS.darkBlack_twenty,
      defaultBackgroundColor: COLORS.white,
      defaultColor: COLORS.darkBlack_hundred,
      disabledBackgroundColor: COLORS.transparent,
      iconColor: COLORS.darkBlack_hundred,
    },
    tertiaryLowLight: {
      activeBackgroundColor: COLORS.darkBlack_twenty,
      defaultBackgroundColor: COLORS.white,
      defaultColor: COLORS.darkBlack_seventy,
      disabledBackgroundColor: COLORS.transparent,
      iconColor: COLORS.darkBlack_seventy,
    },
  }

  const MEDIUM_BUTTON_STYLE = css`
    background-color: ${MEDIUM_BUTTON_PROPS_BY_TYPE[buttonType]
      .defaultBackgroundColor};
    border-radius: ${BORDERS.size_four};
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
      box-shadow: 0 0 0 ${SPACING.spacingS} ${COLORS.fundamentalsFocus};
    }

    &:active {
      background-color: ${MEDIUM_BUTTON_PROPS_BY_TYPE[buttonType]
        .activeBackgroundColor};
    }

    &:disabled {
      background-color: ${MEDIUM_BUTTON_PROPS_BY_TYPE[buttonType]
        .disabledBackgroundColor};
      color: ${COLORS.darkBlack_sixty};
    }
  `
  return (
    <Btn
      disabled={disabled}
      css={MEDIUM_BUTTON_STYLE}
      aria-label={`MediumButton_${buttonType}`}
      display="flex"
      alignItems={ALIGN_CENTER}
      flexDirection={DIRECTION_ROW}
      gridGap={SPACING.spacingSM}
      padding={
        iconName !== undefined
          ? `${SPACING.spacingM} ${SPACING.spacing5}`
          : `${SPACING.spacingM} ${SPACING.spacingXXL}`
      }
      {...buttonProps}
    >
      {iconName !== undefined && (
        <Icon
          name={iconName ?? 'play'}
          aria-label={`MediumButton_${iconName ?? 'play'}`}
          color={
            disabled
              ? COLORS.darkBlack_sixty
              : MEDIUM_BUTTON_PROPS_BY_TYPE[buttonType].iconColor
          }
          size={SPACING.spacingXXL}
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
