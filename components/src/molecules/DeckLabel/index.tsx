import { css } from 'styled-components'

import { getModuleType } from '@opentrons/shared-data'

import { StyledText } from '../../atoms'
import { COLORS } from '../../helix-design-system'
import { ModuleIcon } from '../../icons'
import { Flex } from '../../primitives'
import { ALIGN_CENTER, FLEX_MAX_CONTENT } from '../../styles'
import { SPACING } from '../../ui-style-constants'

import type { FlattenSimpleInterpolation } from 'styled-components'
import type { ReactNode } from 'react'
import type { ModuleModel } from '@opentrons/shared-data'

export interface DeckLabelProps {
  /** Visible label text. */
  text: string
  /** Applies selected-state styling. */
  isSelected: boolean
  /** Renders compact styling and icon sizing for zoomed deck view. */
  isZoomed: boolean
  /** Optional module model used to render a module icon in zoomed view. */
  moduleModel?: ModuleModel
  /** Optional maximum width constraint for the label container. */
  maxWidth?: string
  /** Optional border-radius value applied to label edges. */
  labelBorderRadius?: string
  /** Whether this label is the last item in a grouped sequence. */
  isLast?: boolean
}

export function DeckLabel({
  text,
  isSelected,
  isZoomed,
  moduleModel,
  maxWidth = FLEX_MAX_CONTENT,
  labelBorderRadius,
  isLast = false,
}: DeckLabelProps): ReactNode {
  return (
    <Flex
      fontSize={isZoomed ? '6px' : '18px'}
      data-testid={`DeckLabel_${isSelected ? 'Selected' : 'UnSelected'}`}
      css={
        isSelected
          ? DECK_LABEL_SELECTED_STYLE(maxWidth, labelBorderRadius)
          : DECK_LABEL_UNSELECTED_STYLE(maxWidth, labelBorderRadius, isLast)
      }
    >
      <Flex gridGap={SPACING.spacing2} alignItems={ALIGN_CENTER}>
        {moduleModel != null && isZoomed ? (
          <ModuleIcon size="0.5rem" moduleType={getModuleType(moduleModel)} />
        ) : null}
        <StyledText color={isSelected ? COLORS.white : COLORS.blue50}>
          {text}
        </StyledText>
      </Flex>
    </Flex>
  )
}

const DECK_LABEL_BASE_STYLE = (
  maxWidth: string,
  labelBorderRadius?: string
): FlattenSimpleInterpolation => css`
  width: ${FLEX_MAX_CONTENT};
  max-width: ${maxWidth};
  padding: ${SPACING.spacing2};
  border-radius: ${labelBorderRadius ?? '0'};
`

const DECK_LABEL_SELECTED_STYLE = (
  maxWidth: string,
  labelBorderRadius?: string
): FlattenSimpleInterpolation => css`
  ${DECK_LABEL_BASE_STYLE(maxWidth, labelBorderRadius)}
  color: ${COLORS.white};
  border: 1.5px solid ${COLORS.blue50};
  background-color: ${COLORS.blue50};
`

const DECK_LABEL_UNSELECTED_STYLE = (
  maxWidth: string,
  labelBorderRadius?: string,
  isLast?: boolean
): FlattenSimpleInterpolation => css`
  ${DECK_LABEL_BASE_STYLE(maxWidth, labelBorderRadius)}
  color: ${COLORS.blue50};
  border-right: 1.5px solid ${COLORS.blue50};
  border-bottom: 1.5px solid ${COLORS.blue50};
  border-left: 1.5px solid ${COLORS.blue50};
  background-color: ${COLORS.white};
  border-radius: ${isLast ? labelBorderRadius : '0'};
`
