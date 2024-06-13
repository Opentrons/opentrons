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

// ToDo (kk:03/26/2024) basic will be removed when we add Tag component
export type ChipType =
  | 'basic'
  | 'error'
  | 'info'
  | 'neutral'
  | 'success'
  | 'warning'

type ChipSize = 'medium' | 'small'

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
  /** Chip size medium is the default size */
  chipSize?: ChipSize
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
  // ToDo (kk:06/12/2024) basic will be replaced by a different component
  basic: {
    backgroundColor: `${COLORS.black90}${COLORS.opacity20HexCode}`,
    borderRadius: BORDERS.borderRadius4,
    textColor: COLORS.grey60,
  },
  error: {
    backgroundColor: COLORS.red35,
    borderRadius: BORDERS.borderRadiusFull,
    iconColor: COLORS.red60,
    textColor: COLORS.red60,
  },
  info: {
    backgroundColor: COLORS.blue35,
    borderRadius: BORDERS.borderRadiusFull,
    iconColor: COLORS.blue60,
    textColor: COLORS.blue60,
  },
  neutral: {
    backgroundColor: `${COLORS.black90}${COLORS.opacity20HexCode}`,
    borderRadius: BORDERS.borderRadiusFull,
    iconColor: COLORS.grey60,
    textColor: COLORS.grey60,
  },
  success: {
    backgroundColor: COLORS.green35,
    borderRadius: BORDERS.borderRadiusFull,
    iconColor: COLORS.green60,
    iconName: 'ot-check',
    textColor: COLORS.green60,
  },
  warning: {
    backgroundColor: COLORS.yellow35,
    borderRadius: BORDERS.borderRadiusFull,
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
    chipSize = 'medium',
    ...styleProps
  } = props
  const backgroundColor =
    background === false && type !== 'basic'
      ? COLORS.transparent
      : CHIP_PROPS_BY_TYPE[type].backgroundColor
  const icon = iconName ?? CHIP_PROPS_BY_TYPE[type].iconName ?? 'ot-alert'

  const MEDIUM_CONTAINER_STYLE = css`
    padding: ${SPACING.spacing2} ${background === false ? 0 : SPACING.spacing8};
    grid-gap: ${SPACING.spacing4};
    @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
      padding: ${SPACING.spacing8}
        ${background === false ? 0 : SPACING.spacing16};
      grid-gap: ${SPACING.spacing8};
    }
  `

  const SMALL_CONTAINER_STYLE = css`
    padding: ${SPACING.spacing4} ${background === false ? 0 : SPACING.spacing6};
    grid-gap: ${SPACING.spacing4};
    @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
      padding: ${SPACING.spacing4}
        ${background === false ? 0 : SPACING.spacing8};
      grid-gap: ${SPACING.spacing4};
    }
  `

  const ICON_STYLE = css`
    width: ${chipSize === 'medium' ? '1rem' : '0.75rem'};
    height: ${chipSize === 'medium' ? '1rem' : '0.75rem'};
    @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
      width: ${chipSize === 'medium' ? '1.5rem' : '1.25rem'};
      height: ${chipSize === 'medium' ? '1.5rem' : '1.25rem'};
    }
  `

  const TEXT_STYLE = css`
    ${chipSize === 'medium' ? WEB_MEDIUM_TEXT_STYLE : WEB_SMALL_TEXT_STYLE}
    @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
      ${chipSize === 'medium'
        ? TYPOGRAPHY.bodyTextSemiBold
        : TYPOGRAPHY.smallBodyTextSemiBold}
    }
  `

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      backgroundColor={backgroundColor}
      borderRadius={CHIP_PROPS_BY_TYPE[type].borderRadius}
      flexDirection={DIRECTION_ROW}
      css={
        chipSize === 'medium' ? MEDIUM_CONTAINER_STYLE : SMALL_CONTAINER_STYLE
      }
      data-testid={`Chip_${type}`}
      {...styleProps}
    >
      {type !== 'basic' && hasIcon ? (
        <Icon
          name={icon}
          color={CHIP_PROPS_BY_TYPE[type].iconColor}
          aria-label={`icon_${text}`}
          css={ICON_STYLE}
        />
      ) : null}
      <StyledText css={TEXT_STYLE} color={CHIP_PROPS_BY_TYPE[type].textColor}>
        {text}
      </StyledText>
    </Flex>
  )
}

const WEB_MEDIUM_TEXT_STYLE = css`
  font-size: ${TYPOGRAPHY.fontSizeH4};
  line-height: ${TYPOGRAPHY.lineHeight20};
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
`
const WEB_SMALL_TEXT_STYLE = css`
  font-size: ${TYPOGRAPHY.fontSizeLabel};
  line-height: ${TYPOGRAPHY.lineHeight12};
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
`
