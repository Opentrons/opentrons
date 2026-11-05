import { css } from 'styled-components'

import { BORDERS, COLORS } from '../../helix-design-system'
import { Icon } from '../../icons'
import { Btn, Flex } from '../../primitives'
import { FLEX_MAX_CONTENT } from '../../styles'
import { SPACING } from '../../ui-style-constants'

import type { MouseEvent, ReactNode } from 'react'

type LiquidIconSize = 'xSmall' | 'small' | 'medium'

export interface LiquidIconProps {
  color: string
  size?: LiquidIconSize
  onClick?: (e: MouseEvent<HTMLButtonElement | HTMLDivElement>) => void
  hasError?: boolean
}

export function LiquidIcon(props: LiquidIconProps): ReactNode {
  const { color, size = 'small', onClick, hasError = false } = props

  const sizeStylesMap: Record<
    LiquidIconSize,
    { iconSize: string; padding: string }
  > = {
    xSmall: { iconSize: '0.375rem', padding: SPACING.spacing6 },
    small: { iconSize: '0.5rem', padding: SPACING.spacing8 },
    medium: { iconSize: '1rem', padding: SPACING.spacing12 },
  }

  const LIQUID_ICON_CONTAINER_STYLE = css`
    height: max-content;
    width: max-content;
    background-color: ${COLORS.white};
    border-style: ${BORDERS.styleSolid};
    border-width: 1px;
    border-color: ${hasError ? COLORS.red50 : COLORS.grey30};
    border-radius: ${BORDERS.borderRadius4};

    &:hover {
      border-color: ${onClick != null ? COLORS.grey35 : COLORS.grey30};
    }
    &:active {
      border-color: ${onClick != null ? COLORS.grey40 : COLORS.grey30};
    }
  `

  const liquid = (
    <Flex
      css={LIQUID_ICON_CONTAINER_STYLE}
      padding={sizeStylesMap[size].padding}
      data-testid={`LiquidIcon_${color}`}
    >
      <Icon name="circle" color={color} size={sizeStylesMap[size].iconSize} />
    </Flex>
  )

  return onClick != null ? (
    <Btn
      css={css`
        width: ${FLEX_MAX_CONTENT};
        &:focus-visible {
          outline: 2px solid ${COLORS.white};
          box-shadow: 0 0 0 4px ${COLORS.blue50};
          border-radius: ${BORDERS.borderRadius4};
        }
      `}
      onClick={onClick}
    >
      {liquid}
    </Btn>
  ) : (
    liquid
  )
}
