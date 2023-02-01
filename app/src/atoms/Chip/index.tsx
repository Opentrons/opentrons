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

// Note: When the DS is coming out, we may need to define ChipType like Banner
interface ChipProps {
  text: string
  textColor: string
  iconName: IconName
  iconColor: string
}

// Note: kj a few prop values are hard-coded, but this will be replaced in the future
export function Chip({
  text,
  textColor,
  iconName,
  iconColor,
}: ChipProps): JSX.Element {
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
        color={iconColor}
        aria-label={`icon_${text}`}
        size="1.5rem"
      />
      <StyledText
        fontSize="1.25rem"
        lineHeight="1.6875rem"
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        color={textColor}
      >
        {text}
      </StyledText>
    </Flex>
  )
}
