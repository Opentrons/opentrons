import { css } from 'styled-components'
import { Btn, Flex } from '../../primitives'
import { SPACING } from '../../ui-style-constants'
import { BORDERS, COLORS } from '../../helix-design-system'
import { Icon } from '../../icons'
import { FLEX_MAX_CONTENT } from '../../styles'

type LiquidIconSize = 'small' | 'medium'

interface LiquidIconProps {
  color: string
  size?: LiquidIconSize
  onClick?: () => void
  hasError?: boolean
}

export function LiquidIcon(props: LiquidIconProps): JSX.Element {
  const { color, size = 'small', onClick, hasError = false } = props

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
