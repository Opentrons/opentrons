import * as React from 'react'

import {
  BORDERS,
  Flex,
  DIRECTION_ROW,
  ALIGN_CENTER,
  SPACING,
  TYPOGRAPHY,
  Icon,
  COLORS,
} from '@opentrons/components'

import { StyledText } from '../text'

import type { IconName, StyleProps } from '@opentrons/components'

export type ChipType =
  | 'basic'
  | 'error'
  | 'info'
  | 'neutral'
  | 'success'
  | 'warning'

interface ChipProps extends StyleProps {
  /** Display background color? */
  background?: boolean
  /** Chip icon */
  iconName?: IconName
  /** Chip content */
  text: string
  /** name constant of the text color and the icon color to display */
  type: ChipType
  /** has icon */
  hasIcon?: boolean
}

const CHIP_PROPS_BY_TYPE: Record<
  ChipType,
  {
    backgroundColor: string
    borderRadius: string
    iconColor?: string
    iconName?: IconName
    textColor: string
  }
> = {
  basic: {
    backgroundColor: `${COLORS.black90}${COLORS.opacity20HexCode}`,
    borderRadius: BORDERS.borderRadius4,
    textColor: COLORS.grey60,
  },
  error: {
    backgroundColor: COLORS.red35,
    borderRadius: BORDERS.borderRadius40,
    iconColor: COLORS.red60,
    textColor: COLORS.red60,
  },
  info: {
    backgroundColor: COLORS.blue35,
    borderRadius: BORDERS.borderRadius40,
    iconColor: COLORS.blue60,
    textColor: COLORS.blue60,
  },
  neutral: {
    backgroundColor: `${COLORS.black90}${COLORS.opacity20HexCode}`,
    borderRadius: BORDERS.borderRadius40,
    iconColor: COLORS.grey60,
    textColor: COLORS.grey60,
  },
  success: {
    backgroundColor: COLORS.green35,
    borderRadius: BORDERS.borderRadius40,
    iconColor: COLORS.green60,
    iconName: 'ot-check',
    textColor: COLORS.green60,
  },
  warning: {
    backgroundColor: COLORS.yellow35,
    borderRadius: BORDERS.borderRadius40,
    iconColor: COLORS.yellow60,
    textColor: COLORS.yellow60,
  },
}

export function Chip(props: ChipProps): JSX.Element {
  const {
    background,
    iconName,
    type,
    text,
    hasIcon = true,
    ...styleProps
  } = props
  const backgroundColor =
    background === false && type !== 'basic'
      ? COLORS.transparent
      : CHIP_PROPS_BY_TYPE[type].backgroundColor
  const icon = iconName ?? CHIP_PROPS_BY_TYPE[type].iconName ?? 'ot-alert'
  return (
    <Flex
      alignItems={ALIGN_CENTER}
      backgroundColor={backgroundColor}
      borderRadius={CHIP_PROPS_BY_TYPE[type].borderRadius}
      flexDirection={DIRECTION_ROW}
      padding={`${SPACING.spacing8} ${
        background === false ? 0 : SPACING.spacing16
      }`}
      gridGap={SPACING.spacing8}
      data-testid={`Chip_${type}`}
      {...styleProps}
    >
      {type !== 'basic' && hasIcon ? (
        <Icon
          name={icon}
          color={CHIP_PROPS_BY_TYPE[type].iconColor}
          aria-label={`icon_${text}`}
          size="1.5rem"
          data-testid="RenderResult_icon"
        />
      ) : null}
      <StyledText
        fontSize={TYPOGRAPHY.fontSize22}
        lineHeight={TYPOGRAPHY.lineHeight28}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        color={CHIP_PROPS_BY_TYPE[type].textColor}
      >
        {text}
      </StyledText>
    </Flex>
  )
}
