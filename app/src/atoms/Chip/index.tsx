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

import type { IconName } from '@opentrons/components'

export type ChipType = 'basic' | 'success' | 'warning' | 'neutral'

interface ChipProps {
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
    backgroundColor: COLORS.darkBlack_twenty,
    borderRadius: BORDERS.size_one,
    textColor: COLORS.darkBlack_ninety,
  },
  neutral: {
    backgroundColor: COLORS.darkBlack_twenty,
    borderRadius: BORDERS.size_six,
    iconColor: COLORS.darkBlack_ninety,
    textColor: COLORS.darkBlack_seventy,
  },
  success: {
    backgroundColor: COLORS.green_three,
    borderRadius: BORDERS.size_six,
    iconColor: COLORS.green_one,
    iconName: 'ot-check',
    textColor: COLORS.green_one,
  },
  warning: {
    backgroundColor: COLORS.yellow_three,
    borderRadius: BORDERS.size_six,
    iconColor: COLORS.yellow_two,
    textColor: COLORS.yellow_one,
  },
}

// ToDo (kj:02/09/2023) replace hard-coded values when the DS is out
export function Chip({
  background,
  iconName,
  type,
  text,
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
      padding={`${SPACING.spacing3} ${SPACING.spacing4}`}
      gridGap={SPACING.spacing3}
      data-testid={`Chip_${type}`}
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
        fontSize="1.25rem"
        lineHeight="1.6875rem"
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        color={CHIP_PROPS_BY_TYPE[type].textColor}
      >
        {text}
      </StyledText>
    </Flex>
  )
}
