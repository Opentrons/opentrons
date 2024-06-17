import * as React from 'react'
import { css } from 'styled-components'
import { BORDERS, COLORS } from '../../helix-design-system'
import { Flex } from '../../primitives'
import { StyledText } from '../StyledText'
import { ALIGN_CENTER, DIRECTION_ROW } from '../../styles'
import { RESPONSIVENESS, SPACING, TYPOGRAPHY } from '../../ui-style-constants'
import { Icon } from '../../icons'

import type { IconName } from '../../icons'
import type { StyleProps } from '../../primitives'

export type TagType = 'default' | 'interactive' | 'branded'

interface TagProps extends StyleProps {
  /** Tag content */
  text: string
  /** name constant of the text color and the icon color to display */
  type: TagType
  /** iconLocation */
  iconPosition?: 'left' | 'right'
  /** Tagicon */
  iconName?: IconName
}

const defaultColors = {
  backgroundColor: `${COLORS.black90}${COLORS.opacity20HexCode}`,
  color: COLORS.black90,
}

const TAG_PROPS_BY_TYPE: Record<
  TagType,
  {
    backgroundColor: string
    color: string
  }
> = {
  default: defaultColors,
  interactive: defaultColors,
  branded: {
    backgroundColor: COLORS.blue50,
    color: COLORS.white,
  },
}

export function Tag(props: TagProps): JSX.Element {
  const { iconName, type, text, iconPosition, ...styleProps } = props

  const DEFAULT_CONTAINER_STYLE = css`
    padding: 2px 8px;
    border-radius: ${BORDERS.borderRadius4};
    @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
      border-radius: ${BORDERS.borderRadius8};
      padding: 8px 12px;
    }
  `

  const INTERACTIVE_CONTAINER_STYLE = css`
    ${DEFAULT_CONTAINER_STYLE}
    &:hover {
      background-color: ${COLORS.black90}${COLORS.opacity40HexCode};
    }
    &:focus-visible {
      background-color: ${COLORS.black90}${COLORS.opacity40HexCode};
      box-shadow: 0 0 0 3px ${COLORS.blue50};
    }
  `

  const ICON_STYLE = css`
    width: 0.75rem;
    height: 0.875rem;
    @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
      width: 1.5rem;
      height: 1.5rem;
    }
  `

  const TEXT_STYLE = css`
    ${TYPOGRAPHY.h3Regular}
    @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
      ${TYPOGRAPHY.bodyTextRegular}
    }
  `

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      flexDirection={DIRECTION_ROW}
      color={TAG_PROPS_BY_TYPE[type].color}
      backgroundColor={TAG_PROPS_BY_TYPE[type].backgroundColor}
      css={
        type === 'interactive'
          ? INTERACTIVE_CONTAINER_STYLE
          : DEFAULT_CONTAINER_STYLE
      }
      gridGap={SPACING.spacing4}
      data-testid={`Tag_${type}`}
      {...styleProps}
    >
      {iconName != null && iconPosition === 'left' ? (
        <Icon name={iconName} aria-label={`icon_${text}`} css={ICON_STYLE} />
      ) : null}
      <StyledText css={TEXT_STYLE}>{text}</StyledText>
      {iconName != null && iconPosition === 'right' ? (
        <Icon name={iconName} aria-label={`icon_${text}`} css={ICON_STYLE} />
      ) : null}
    </Flex>
  )
}
