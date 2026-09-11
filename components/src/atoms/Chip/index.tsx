import { css } from 'styled-components'

import { BORDERS, COLORS } from '../../helix-design-system'
import { Icon } from '../../icons'
import { Flex } from '../../primitives'
import { ALIGN_CENTER, DIRECTION_ROW, FLEX_MAX_CONTENT } from '../../styles'
import { RESPONSIVENESS, SPACING, TYPOGRAPHY } from '../../ui-style-constants'
import { LegacyStyledText } from '../StyledText'

import type { FlattenSimpleInterpolation } from 'styled-components'
import type { IconName } from '../../icons'
import type { StyleProps } from '../../primitives'

export type ChipType = 'error' | 'info' | 'neutral' | 'success' | 'warning'

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
  /** icon should pulse */
  pulseIcon?: boolean
}

const CHIP_PROPS_BY_TYPE: Record<
  ChipType,
  {
    backgroundColor30: string
    backgroundColor35: string
    borderRadius: string
    iconColor?: string
    iconName?: IconName
    textColor: string
  }
> = {
  error: {
    backgroundColor30: COLORS.red30,
    backgroundColor35: COLORS.red35,
    borderRadius: BORDERS.borderRadiusFull,
    iconColor: COLORS.red60,
    textColor: COLORS.red60,
  },
  info: {
    backgroundColor30: COLORS.blue30,
    backgroundColor35: COLORS.blue35,
    borderRadius: BORDERS.borderRadiusFull,
    iconColor: COLORS.blue60,
    textColor: COLORS.blue60,
  },
  neutral: {
    backgroundColor30: `${COLORS.black90}${COLORS.opacity20HexCode}`,
    backgroundColor35: `${COLORS.black90}${COLORS.opacity20HexCode}`,
    borderRadius: BORDERS.borderRadiusFull,
    iconColor: COLORS.grey60,
    textColor: COLORS.grey60,
  },
  success: {
    backgroundColor30: COLORS.green30,
    backgroundColor35: COLORS.green35,
    borderRadius: BORDERS.borderRadiusFull,
    iconColor: COLORS.green60,
    iconName: 'ot-check',
    textColor: COLORS.green60,
  },
  warning: {
    backgroundColor30: COLORS.yellow30,
    backgroundColor35: COLORS.yellow35,
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
    pulseIcon = false,
    ...styleProps
  } = props
  const chipProps = CHIP_PROPS_BY_TYPE[type]
  const icon = iconName ?? chipProps.iconName ?? 'ot-alert'
  const iconColor = chipProps.iconColor
  const getIconSize = (iconName: string | undefined): string => {
    switch (iconName) {
      case 'connection-status':
        return '0.5rem'
      case 'circle':
        return '0.375rem'
      default:
        return '0.75rem'
    }
  }
  const smallSize = getIconSize(icon)

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      borderRadius={chipProps.borderRadius}
      flexDirection={DIRECTION_ROW}
      height={FLEX_MAX_CONTENT}
      css={css`
        background-color: ${
          background === false
            ? COLORS.transparent
            : chipProps.backgroundColor30
        };

        ${
          chipSize === 'medium'
            ? MEDIUM_CONTAINER_STYLE(background)
            : SMALL_CONTAINER_STYLE(background)
        }

        /* touchscreen */
        ${background !== false ? BACKGROUND_COLOR_STYLE(type) : ''}
      `}
      data-testid={`Chip_${type}`}
      {...styleProps}
    >
      {hasIcon ? (
        <Icon
          name={icon}
          color={iconColor}
          data-testid={`icon_${text}`}
          css={ICON_STYLE(chipSize, smallSize)}
        >
          {pulseIcon ? (
            <animate
              attributeName="fill"
              values={`${iconColor}; transparent`}
              dur="1s"
              calcMode="discrete"
              repeatCount="indefinite"
              data-testid={`Chip_${type}_icon_animate`}
            />
          ) : null}
        </Icon>
      ) : null}
      <LegacyStyledText css={TEXT_STYLE(chipSize)} color={chipProps.textColor}>
        {text}
      </LegacyStyledText>
    </Flex>
  )
}

const WEB_MEDIUM_TEXT_STYLE = css`
  font-size: ${TYPOGRAPHY.fontSizeH4};
  line-height: ${TYPOGRAPHY.lineHeight20};
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
`
const WEB_SMALL_TEXT_STYLE = css`
  font-size: ${TYPOGRAPHY.fontSizeP};
  line-height: ${TYPOGRAPHY.lineHeight16};
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
`

const ICON_STYLE = (
  chipSize: ChipSize,
  smallSize: string
): FlattenSimpleInterpolation => css`
  width: ${chipSize === 'medium' ? '1rem' : smallSize};
  height: ${chipSize === 'medium' ? '1rem' : smallSize};
  flex-shrink: 0;

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    width: ${chipSize === 'medium' ? '1.5rem' : '1.25rem'};
    height: ${chipSize === 'medium' ? '1.5rem' : '1.25rem'};
  }
`

const TEXT_STYLE = (chipSize: ChipSize): FlattenSimpleInterpolation => css`
  ${chipSize === 'medium' ? WEB_MEDIUM_TEXT_STYLE : WEB_SMALL_TEXT_STYLE}

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    ${
      chipSize === 'medium'
        ? TYPOGRAPHY.bodyTextSemiBold
        : TYPOGRAPHY.smallBodyTextSemiBold
    }
  }
`

const MEDIUM_CONTAINER_STYLE = (
  background?: boolean
): FlattenSimpleInterpolation => css`
  padding: ${SPACING.spacing2} ${background === false ? 0 : SPACING.spacing8};
  gap: ${SPACING.spacing4};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    padding: ${SPACING.spacing8} ${background === false ? 0 : SPACING.spacing16};
    gap: ${SPACING.spacing8};
  }
`

const SMALL_CONTAINER_STYLE = (
  background?: boolean
): FlattenSimpleInterpolation => css`
  padding: ${SPACING.spacing4} ${background === false ? 0 : SPACING.spacing6};
  gap: ${SPACING.spacing4};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    padding: ${SPACING.spacing4} ${background === false ? 0 : SPACING.spacing8};
    gap: ${SPACING.spacing4};
  }
`

const BACKGROUND_COLOR_STYLE = (
  type: ChipType
): FlattenSimpleInterpolation => css`
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    background-color: ${CHIP_PROPS_BY_TYPE[type].backgroundColor35};
  }
`
