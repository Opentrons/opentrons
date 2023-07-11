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

export type ChipType = 'basic' | 'success' | 'warning' | 'neutral'

interface ChipProps extends StyleProps {
  /** Display background color? */
  background?: boolean
  /** Chip icon */
  iconName?: IconName
  /** Chip content */
  text: string
  /** name constant of the text color and the icon color to display */
  type: ChipType
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
    backgroundColor: COLORS.darkBlack20,
    borderRadius: BORDERS.borderRadiusSize1,
    textColor: COLORS.darkBlack90,
  },
  neutral: {
    backgroundColor: COLORS.darkBlack20,
    borderRadius: BORDERS.borderRadiusSize6,
    iconColor: COLORS.darkBlack90,
    textColor: COLORS.darkBlack70,
  },
  success: {
    backgroundColor: COLORS.green3,
    borderRadius: BORDERS.borderRadiusSize6,
    iconColor: COLORS.green1,
    iconName: 'ot-check',
    textColor: COLORS.green1,
  },
  warning: {
    backgroundColor: COLORS.yellow3,
    borderRadius: BORDERS.borderRadiusSize6,
    iconColor: COLORS.yellow1,
    textColor: COLORS.yellow1,
  },
}

export function Chip({
  background,
  iconName,
  type,
  text,
  ...styleProps
}: ChipProps): JSX.Element {
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
      {type !== 'basic' && (
        <Icon
          name={icon}
          color={CHIP_PROPS_BY_TYPE[type].iconColor}
          aria-label={`icon_${text}`}
          size="1.5rem"
          data-testid="RenderResult_icon"
        />
      )}
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
