import * as React from 'react'

import {
  BORDERS,
  Flex,
  DIRECTION_ROW,
  ALIGN_CENTER,
  SPACING,
  TYPOGRAPHY,
  Icon,
  LEGACY_COLORS,
} from '@opentrons/components'

import { StyledText } from '../text'

import type { IconName, StyleProps } from '@opentrons/components'

export type ChipType = 'basic' | 'error' | 'neutral' | 'success' | 'warning'

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
    backgroundColor: LEGACY_COLORS.darkBlack20,
    borderRadius: BORDERS.borderRadiusSize1,
    textColor: LEGACY_COLORS.darkBlack90,
  },
  error: {
    backgroundColor: LEGACY_COLORS.red3,
    borderRadius: BORDERS.borderRadiusSize5,
    iconColor: LEGACY_COLORS.red1,
    textColor: LEGACY_COLORS.red1,
  },
  neutral: {
    backgroundColor: LEGACY_COLORS.darkBlack20,
    borderRadius: BORDERS.borderRadiusSize5,
    iconColor: LEGACY_COLORS.darkBlack90,
    textColor: LEGACY_COLORS.darkBlack70,
  },
  success: {
    backgroundColor: LEGACY_COLORS.green3,
    borderRadius: BORDERS.borderRadiusSize5,
    iconColor: LEGACY_COLORS.green1,
    iconName: 'ot-check',
    textColor: LEGACY_COLORS.green1,
  },
  warning: {
    backgroundColor: LEGACY_COLORS.yellow3,
    borderRadius: BORDERS.borderRadiusSize5,
    iconColor: LEGACY_COLORS.yellow1,
    textColor: LEGACY_COLORS.yellow1,
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
      ? LEGACY_COLORS.transparent
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
