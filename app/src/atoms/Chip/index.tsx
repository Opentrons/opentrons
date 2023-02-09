import * as React from 'react'

import {
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

export type ChipType = 'success' | 'warning' | 'error' | 'informing'

// Note: When the DS is coming out, we may need to define ChipType like Banner
interface ChipProps {
  /** name constant of the text color and the icon color to display */
  type: ChipType
  /** Chip content */
  text: string
  /** Chip icon */
  iconName: IconName
}

const CHIP_PROPS_BY_TYPE: Record<
  ChipType,
  { textColor: string; iconColor: string }
> = {
  success: {
    textColor: COLORS.successText,
    iconColor: COLORS.successEnabled,
  },
  error: {
    textColor: COLORS.errorText,
    iconColor: COLORS.errorEnabled,
  },
  warning: {
    textColor: COLORS.warningText,
    iconColor: COLORS.warningEnabled,
  },
  informing: {
    textColor: COLORS.darkGreyEnabled,
    iconColor: COLORS.darkGreyEnabled,
  },
}

// ToDo (kj:02/09/2023) replace hard-coded values when the DS is out
export function Chip({ type, text, iconName }: ChipProps): JSX.Element {
  return (
    <Flex
      flexDirection={DIRECTION_ROW}
      padding={`${SPACING.spacing3} ${SPACING.spacing4}`}
      backgroundColor={COLORS.white}
      borderRadius="1.9375rem"
      alignItems={ALIGN_CENTER}
      gridGap={SPACING.spacing3}
    >
      <Icon
        name={iconName}
        color={CHIP_PROPS_BY_TYPE[type].iconColor}
        aria-label={`icon_${text}`}
        size="1.5rem"
      />
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
