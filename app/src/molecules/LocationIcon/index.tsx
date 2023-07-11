import * as React from 'react'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  Flex,
  Icon,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'

import type { IconName } from '@opentrons/components'

interface LocationIconProps {
  /** name constant of the slot to display */
  slotName?: string
  /** name constant of the slot to display */
  iconName?: IconName
}

export function LocationIcon({
  slotName,
  iconName,
}: LocationIconProps): JSX.Element {
  return (
    <Flex
      alignItems={ALIGN_CENTER}
      height="2rem"
      width="max-content"
      padding={`${SPACING.spacing4} ${SPACING.spacing8}`}
      border={`2px solid ${COLORS.darkBlack100}`}
      borderRadius={BORDERS.borderRadiusSize3}
      data-testid={
        slotName != null
          ? `LocationIcon_${slotName}`
          : `LocationIcon_${String(iconName)}`
      }
    >
      {iconName != null ? (
        <Icon
          name={iconName}
          size="1.25rem"
          color={COLORS.darkBlack100}
          aria-label={iconName}
        />
      ) : (
        <StyledText as="label" fontWeight={TYPOGRAPHY.fontWeightBold}>
          {slotName}
        </StyledText>
      )}
    </Flex>
  )
}
