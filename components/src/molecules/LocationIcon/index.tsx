import * as React from 'react'
import { css } from 'styled-components'

import { Icon } from '../../icons'
import { Flex, Text } from '../../primitives'
import { ALIGN_CENTER } from '../../styles'
import {
  BORDERS,
  COLORS,
  RESPONSIVENESS,
  SPACING,
  TYPOGRAPHY,
} from '../../ui-style-constants'

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

const LOCATION_ICON_STYLE = css<{
  slotName?: string
  height?: string
  width?: string
}>`
  align-items: ${ALIGN_CENTER};
  border: 2px solid ${COLORS.darkBlack100};
  border-radius: ${BORDERS.borderRadiusSize3};
  height: ${props => props.height ?? SPACING.spacing32};
  padding: ${SPACING.spacing2} 0.375rem;
  width: ${props => props.width ?? 'max-content'};
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    padding: ${SPACING.spacing4}
      ${props => (props.slotName != null ? SPACING.spacing8 : SPACING.spacing6)};
  }
`

const SLOT_NAME_TEXT_STYLE = css`
  ${TYPOGRAPHY.pSemiBold}
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    ${TYPOGRAPHY.smallBodyTextBold}
  }
`

export function LocationIcon({
  slotName,
  iconName,
  ...styleProps
}: LocationIconProps): JSX.Element {
  return (
    <Flex
      data-testid={
        slotName != null
          ? `LocationIcon_${slotName}`
          : `LocationIcon_${String(iconName)}`
      }
      css={LOCATION_ICON_STYLE}
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
        <Text css={SLOT_NAME_TEXT_STYLE}>{slotName}</Text>
      )}
    </Flex>
  )
}
