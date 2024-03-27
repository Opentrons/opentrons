import * as React from 'react'
import { css } from 'styled-components'
import { BORDERS, COLORS } from '../../helix-design-system'
import { Flex } from '../../primitives'
import { StyledText } from '../StyledText'
import { ALIGN_CENTER, DIRECTION_ROW } from '../../styles'
import { SPACING, TYPOGRAPHY } from '../../ui-style-constants'
import { Icon } from '../../icons'
import { isTouchscreen } from '../../ui-style-constants/responsiveness'

import type { FlattenSimpleInterpolation } from 'styled-components'
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

type ChipConfig = 'web-medium' | 'web-small' | 'touch-medium' | 'touch-small'

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
  basic: {
    backgroundColor: `${COLORS.black90}${COLORS.opacity20HexCode}`,
    borderRadius: BORDERS.borderRadius4,
    textColor: COLORS.grey60,
  },
  error: {
    backgroundColor: COLORS.red35,
    borderRadius: BORDERS.borderRadius40,
    iconColor: COLORS.red60,
    textColor: COLORS.red60,
  },
  info: {
    backgroundColor: COLORS.blue35,
    borderRadius: BORDERS.borderRadius40,
    iconColor: COLORS.blue60,
    textColor: COLORS.blue60,
  },
  neutral: {
    backgroundColor: `${COLORS.black90}${COLORS.opacity20HexCode}`,
    borderRadius: BORDERS.borderRadius40,
    iconColor: COLORS.grey60,
    textColor: COLORS.grey60,
  },
  success: {
    backgroundColor: COLORS.green35,
    borderRadius: BORDERS.borderRadius40,
    iconColor: COLORS.green60,
    iconName: 'ot-check',
    textColor: COLORS.green60,
  },
  warning: {
    backgroundColor: COLORS.yellow35,
    borderRadius: BORDERS.borderRadius40,
    iconColor: COLORS.yellow60,
    textColor: COLORS.yellow60,
  },
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
  const chipConfig: ChipConfig = `${
    isTouchscreen ? 'touch' : 'web'
  }-${chipSize}`

  console.log(`chipConfig`, chipConfig)

  const TOUCHSCREEN_MEDIUM_CONTAINER_STYLE = css`
    padding: ${SPACING.spacing8} ${background === false ? 0 : SPACING.spacing16};
    grid-gap: ${SPACING.spacing8};
  `

  const TOUCHSCREEN_SMALL_CONTAINER_STYLE = css`
    padding: ${SPACING.spacing4} ${background === false ? 0 : SPACING.spacing8};
    grid-gap: ${SPACING.spacing4};
  `

  const WEB_MEDIUM_CONTAINER_STYLE = css`
    padding: ${SPACING.spacing2} ${background === false ? 0 : SPACING.spacing8};
    grid-gap: ${SPACING.spacing4};
  `

  const WEB_SMALL_CONTAINER_STYLE = css`
    padding: ${SPACING.spacing4} ${background === false ? 0 : SPACING.spacing6};
    grid-gap: ${SPACING.spacing4};
  `

  const CHIP_PROPS_BY_SIZE_AND_PLATFORM: Record<
    ChipConfig,
    {
      containerStyle: FlattenSimpleInterpolation
      textStyle: FlattenSimpleInterpolation
      size: string
    }
  > = {
    'web-medium': {
      containerStyle: WEB_MEDIUM_CONTAINER_STYLE,
      textStyle: WEB_MEDIUM_TEXT_STYLE,
      size: '1rem',
    },
    'web-small': {
      containerStyle: WEB_SMALL_CONTAINER_STYLE,
      textStyle: WEB_SMALL_TEXT_STYLE,
      size: '0.75rem',
    },
    'touch-medium': {
      containerStyle: TOUCHSCREEN_MEDIUM_CONTAINER_STYLE,
      textStyle: TYPOGRAPHY.bodyTextSemiBold,
      size: '1.5rem',
    },
    'touch-small': {
      containerStyle: TOUCHSCREEN_SMALL_CONTAINER_STYLE,
      textStyle: TYPOGRAPHY.smallBodyTextSemiBold,
      size: '1.25rem',
    },
  }

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      backgroundColor={backgroundColor}
      borderRadius={CHIP_PROPS_BY_TYPE[type].borderRadius}
      flexDirection={DIRECTION_ROW}
      css={CHIP_PROPS_BY_SIZE_AND_PLATFORM[chipConfig].containerStyle}
      data-testid={`Chip_${type}`}
      {...styleProps}
    >
      {type !== 'basic' && hasIcon ? (
        <Icon
          name={icon}
          color={CHIP_PROPS_BY_TYPE[type].iconColor}
          aria-label={`icon_${text}`}
          size={CHIP_PROPS_BY_SIZE_AND_PLATFORM[chipConfig].size}
        />
      ) : null}
      <StyledText
        css={CHIP_PROPS_BY_SIZE_AND_PLATFORM[chipConfig].textStyle}
        color={CHIP_PROPS_BY_TYPE[type].textColor}
      >
        {text}
      </StyledText>
    </Flex>
  )
}
