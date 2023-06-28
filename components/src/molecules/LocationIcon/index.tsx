import * as React from 'react'

import { Icon } from '../../icons'
import { Flex, Text } from '../../primitives'
import { ALIGN_CENTER } from '../../styles'
import { BORDERS, COLORS, SPACING, TYPOGRAPHY } from '../../ui-style-constants'

import type { IconName } from '../../icons'
import type { StyleProps } from '../../primitives'

interface SlotLocationProps extends StyleProps {
  /** name constant of the slot to display */
  slotName: string
  iconName?: undefined
}

interface HardwareIconProps extends StyleProps {
  /** hardware icon name */
  iconName: IconName
  slotName?: undefined
}

// type union requires one of slotName or iconName, but not both
type LocationIconProps = SlotLocationProps | HardwareIconProps

export function LocationIcon({
  slotName,
  iconName,
  ...styleProps
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
      {...styleProps}
    >
      {iconName != null ? (
        <Icon
          name={iconName}
          size="1.25rem"
          color={COLORS.darkBlack100}
          aria-label={iconName}
        />
      ) : (
        <Text css={TYPOGRAPHY.smallBodyTextBold}>{slotName}</Text>
      )}
    </Flex>
  )
}
