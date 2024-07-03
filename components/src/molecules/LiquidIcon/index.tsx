import * as React from 'react'
import { Flex } from '../../primitives'
import { SPACING } from '../../ui-style-constants'
import { BORDERS, COLORS } from '../../helix-design-system'
import { css } from 'styled-components'
import { Icon } from '../../icons'

type LiquidIconSize = 'small' | 'medium'

interface LiquidIconProps {
  color: string
  size?: LiquidIconSize
}

const LIQUID_ICON_CONTAINER_STYLE = css`
  height: max-content;
  width: max-content;
  background-color: ${COLORS.white};
  border-style: ${BORDERS.styleSolid};
  border-width: 1px;
  border-color: ${COLORS.grey30};
  border-radius: ${BORDERS.borderRadius4};
`

export function LiquidIcon(props: LiquidIconProps): JSX.Element {
  const { color, size = 'small' } = props
  return (
    <Flex
      css={LIQUID_ICON_CONTAINER_STYLE}
      padding={size === 'medium' ? SPACING.spacing12 : SPACING.spacing8}
      data-testid={`LiquidIcon_${color}`}
    >
      <Icon
        name="circle"
        color={color}
        size={size === 'medium' ? '1rem' : '0.5rem'}
      />
    </Flex>
  )
}
