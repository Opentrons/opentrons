import * as React from 'react'
import { css } from 'styled-components'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_ROW,
  Flex,
  Icon,
  NewPrimaryBtn,
  SPACING,
  styleProps,
  TYPOGRAPHY,
} from '@opentrons/components'
import { StyledText } from '../../text'
import type { IconName, StyleProps } from '@opentrons/components'

type MediumButtonTypes =
  | 'primary'
  | 'secondary'
  | 'alert'
  | 'alertSecondary'
  | 'tertiary'
  | 'tertiaryLight'
interface MediumButtonProps extends StyleProps {
  buttonText: React.ReactNode
  buttonType?: MediumButtonTypes
  disabled?: boolean
  iconName?: IconName
  onClick: () => void
}

export function MediumButton(props: MediumButtonProps): JSX.Element {
  const {
    buttonText,
    buttonType = 'primary',
    disabled = false,
    iconName,
    onClick,
  } = props
  const buttonProps = {
    disabled,
    onClick,
  }

  const MEDIUM_BUTTON_PROPS_BY_TYPE: Record<
    MediumButtonTypes,
    {
      activeBackgroundColor: string
      defaultBackgroundColor: string
      defaultColor: string
      iconColor: string
    }
  > = {
    alert: {
      activeBackgroundColor: '#b91f20',
      defaultBackgroundColor: COLORS.red_two,
      defaultColor: COLORS.white,
      iconColor: COLORS.white,
    },
    alertSecondary: {
      activeBackgroundColor: '#ccabac',
      defaultBackgroundColor: COLORS.red_three,
      defaultColor: COLORS.red_one,
      iconColor: COLORS.red_one,
    },
    primary: {
      activeBackgroundColor: '#045dd0',
      defaultBackgroundColor: COLORS.blueEnabled,
      defaultColor: COLORS.white,
      iconColor: COLORS.white,
    },
    secondary: {
      activeBackgroundColor: '#94afd4',
      defaultBackgroundColor: COLORS.foundationalBlue,
      defaultColor: COLORS.darkBlackEnabled,
      iconColor: COLORS.blueEnabled,
    },
    tertiary: {
      activeBackgroundColor: COLORS.darkBlack_twenty,
      defaultBackgroundColor: COLORS.white,
      defaultColor: COLORS.darkBlack_hundred,
      iconColor: COLORS.darkBlack_hundred,
    },
    tertiaryLight: {
      activeBackgroundColor: COLORS.darkBlack_twenty,
      defaultBackgroundColor: COLORS.white,
      defaultColor: COLORS.darkBlack_seventy,
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
      <Flex
        alignItems={ALIGN_CENTER}
        flexDirection={DIRECTION_ROW}
        gridGap={SPACING.spacingSM}
      >
        {iconName !== null && (
          <Icon
            name={iconName ?? 'play'}
            aria-label={`MediumButton_${iconName ?? 'play'}`}
            color={
              disabled
                ? COLORS.darkBlack_sixty
                : MEDIUM_BUTTON_PROPS_BY_TYPE[buttonType].iconColor
            }
            width="1.875rem"
            height="1.875rem"
          />
        )}
        <StyledText
          fontSize={TYPOGRAPHY.fontSize28}
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          lineHeight={TYPOGRAPHY.lineHeight36}
        >
          {buttonText}
        </StyledText>
      </Flex>
    </NewPrimaryBtn>
  )
}
