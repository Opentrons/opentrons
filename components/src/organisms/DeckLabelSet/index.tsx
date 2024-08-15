import * as React from 'react'
import styled from 'styled-components'
import { Flex } from '../../primitives'
import { BORDERS, COLORS } from '../../helix-design-system'
import { DIRECTION_COLUMN, FLEX_MAX_CONTENT } from '../../styles'

import { DeckLabel } from '../../molecules/DeckLabel'
import { SPACING } from '../../ui-style-constants'

import type { DeckLabelProps } from '../../molecules/DeckLabel'

interface DeckLabelSetProps {
  children: React.ReactNode
  deckLabels: DeckLabelProps[]
}

export function DeckLabelSet({
  children,
  deckLabels,
}: DeckLabelSetProps): JSX.Element {
  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <StyledFlex data-testid="DeckLabeSet">{children}</StyledFlex>
      <LabelContainer>
        {deckLabels.length > 0
          ? deckLabels.map((deckLabel, index) => (
              <DeckLabel
                key={`DeckLabel_${index}`}
                {...deckLabel}
                isLast={deckLabels.length - 1 === index}
              />
            ))
          : null}
      </LabelContainer>
    </Flex>
  )
}

const StyledFlex = styled(Flex)`
  width: 100%;
  height: ${FLEX_MAX_CONTENT};
  border-radius: ${BORDERS.borderRadius8};
  border: 3px solid ${COLORS.blue50};
`

const LabelContainer = styled(Flex)`
  flex-direction: ${DIRECTION_COLUMN};
  padding-left: ${SPACING.spacing24};

  & > *:not(:last-child) {
    margin-bottom: -3px;
  }

  & > *:last-child {
    border-bottom-left-radius: ${BORDERS.borderRadius8};
    border-bottom-right-radius: ${BORDERS.borderRadius8};
  }
`
