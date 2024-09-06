import * as React from 'react'
import { css } from 'styled-components'
import { Flex } from '../../primitives'
import { FLEX_MAX_CONTENT } from '../../styles'
import { COLORS } from '../../helix-design-system'
import { SPACING } from '../../ui-style-constants'
import { StyledText } from '../../atoms'

import type { FlattenSimpleInterpolation } from 'styled-components'

export interface DeckLabelProps {
  text: string
  isSelected: boolean
  labelBorderRadius?: string
  isLast?: boolean
}

export function DeckLabel({
  text,
  isSelected,
  labelBorderRadius,
  isLast = false,
}: DeckLabelProps): JSX.Element {
  const DECK_LABEL_BASE_STYLE = (
    labelBorderRadius?: string
  ): FlattenSimpleInterpolation => css`
    width: ${FLEX_MAX_CONTENT};
    padding: ${SPACING.spacing2};
    border-radius: ${labelBorderRadius ?? '0'};
  `
  const DECK_LABEL_SELECTED_STYLE = (
    labelBorderRadius?: string
  ): FlattenSimpleInterpolation => css`
    ${DECK_LABEL_BASE_STYLE(labelBorderRadius)}
    color: ${COLORS.white};
    border: 1.5px solid ${COLORS.blue50};
    background-color: ${COLORS.blue50};
  `

  const DECK_LABEL_UNSELECTED_STYLE = (
    labelBorderRadius?: string,
    isLast?: boolean
  ): FlattenSimpleInterpolation => css`
    ${DECK_LABEL_BASE_STYLE(labelBorderRadius)}
    color: ${COLORS.blue50};
    border-right: 1.5px solid ${COLORS.blue50};
    border-bottom: ${isLast ? `1.5px solid ${COLORS.blue50}` : undefined};
    border-left: 1.5px solid ${COLORS.blue50};
    background-color: ${COLORS.white};
    border-radius: ${isLast ? labelBorderRadius : '0'};
  `

  return (
    <Flex
      fontSize="6px"
      data-testid={`DeckLabel_${isSelected ? 'Selected' : 'UnSelected'}`}
      css={
        isSelected
          ? DECK_LABEL_SELECTED_STYLE(labelBorderRadius)
          : DECK_LABEL_UNSELECTED_STYLE(labelBorderRadius, isLast)
      }
    >
      <StyledText color={isSelected ? COLORS.white : COLORS.blue50}>
        {text}
      </StyledText>
    </Flex>
  )
}
