import * as React from 'react'
import { css } from 'styled-components'
import {
  TYPOGRAPHY,
  COLORS,
  SPACING,
  BORDERS,
  Btn,
  Flex,
  styleProps,
  Icon,
  DIRECTION_ROW,
} from '@opentrons/components'
import { ODD_FOCUS_VISIBLE_STYLE } from '../../../App/constants'
import { StyledText } from '../../text'
import type { IconName, StyleProps } from '@opentrons/components'

type SmallButtonTypes =
  | 'alt'
  | 'alert'
  | 'default'
  | 'tertiaryLowLight'
  | 'tertiaryHighLight'

type SmallButtonCategory = 'default' | 'rounded'

type IconPlacement = 'left' | 'right'
interface SmallButtonProps extends StyleProps {
  onClick: () => void
  buttonType: SmallButtonTypes
  buttonText: React.ReactNode
  iconPlacement?: IconPlacement
  iconName?: IconName
  buttonCategory?: SmallButtonCategory // if not specified, it will be 'default'
  disabled?: boolean
}

export function SmallButton(props: SmallButtonProps): JSX.Element {
  const {
    onClick,
    buttonType,
    buttonText,
    buttonCategory = 'default',
    disabled,
    iconPlacement,
    iconName,
  } = props
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
      disabledColor: `${COLORS.darkBlack_sixty}`,
    },
    alert: {
      defaultColor: COLORS.white,
      defaultBackgroundColor: COLORS.red_two,
      activeBackgroundColor: '#ab302a',
      disabledBackgroundColor: `${COLORS.darkBlack_twenty}`,
      disabledColor: `${COLORS.darkBlack_sixty}`,
    },
    default: {
      defaultColor: COLORS.white,
      defaultBackgroundColor: COLORS.blueEnabled,
      activeBackgroundColor: '#2160ca',
      disabledBackgroundColor: `${COLORS.darkBlack_twenty}`,
      disabledColor: `${COLORS.darkBlack_sixty}`,
    },
    tertiaryHighLight: {
      defaultColor: `${COLORS.darkBlack_seventy}`,
      defaultBackgroundColor: `${COLORS.blueEnabled}${COLORS.opacity0HexCode}`,
      activeBackgroundColor: `${COLORS.darkBlack_twenty}`,
      disabledBackgroundColor: `${COLORS.blueEnabled}${COLORS.opacity0HexCode}`,
      disabledColor: `${COLORS.darkBlack_sixty}`,
    },
    tertiaryLowLight: {
      defaultColor: COLORS.darkBlackEnabled,
      defaultBackgroundColor: ` ${COLORS.blueEnabled}${COLORS.opacity0HexCode}`,
      activeBackgroundColor: `${COLORS.darkBlack_twenty}`,
      disabledBackgroundColor: `${COLORS.blueEnabled}${COLORS.opacity0HexCode}`,
      disabledColor: `${COLORS.darkBlack_sixty}`,
    },
  }

  const SMALL_BUTTON_STYLE = css`
    color: ${SMALL_BUTTON_PROPS_BY_TYPE[buttonType].defaultColor};
    background-color: ${SMALL_BUTTON_PROPS_BY_TYPE[buttonType]
      .defaultBackgroundColor};
    cursor: default;
    border-radius: ${buttonCategory === 'rounded'
      ? BORDERS.size_five
      : BORDERS.size_four};
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
      box-shadow: ${ODD_FOCUS_VISIBLE_STYLE};
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
      {...buttonProps}
      css={SMALL_BUTTON_STYLE}
      aria-label={`SmallButton_${buttonType}`}
    >
      <Flex
        flexDirection={DIRECTION_ROW}
        alignItems={TYPOGRAPHY.textAlignCenter}
      >
        {iconPlacement === 'left' && iconName != null ? (
          <Flex aria-label={`SmallButton_${iconName}_positionLeft`}>
            <Icon
              width="1.75rem"
              height="1.75rem"
              marginRight="0.77375rem"
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
        {iconPlacement === 'right' && iconName != null ? (
          <Flex aria-label={`SmallButton_${iconName}_positionRight`}>
            <Icon
              width="1.75rem"
              height="1.75rem"
              marginLeft="0.77375rem"
              name={iconName}
            />
          </Flex>
        ) : null}
      </Flex>
    </Btn>
  )
}
