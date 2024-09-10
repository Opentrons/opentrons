import * as React from 'react'
import styled from 'styled-components'
import { Box } from '../../primitives'
import { BORDERS, COLORS } from '../../helix-design-system'
import { RobotCoordsForeignDiv } from '../../hardware-sim'

import { DeckLabel } from '../../molecules/DeckLabel'
import { SPACING } from '../../ui-style-constants'

import type { DeckLabelProps } from '../../molecules/DeckLabel'

interface DeckLabelSetProps {
  deckLabels: DeckLabelProps[]
  x: number
  y: number
  width: number
  height: number
}

const DeckLabelSetComponent = (
  props: DeckLabelSetProps,
  ref: React.ForwardedRef<HTMLDivElement>
): JSX.Element => {
  const { deckLabels, x, y, width, height } = props

  return (
    <RobotCoordsForeignDiv x={x} y={y}>
      <StyledBox width={width} height={height} data-testid="DeckLabeSet" />
      <LabelContainer ref={ref}>
        {deckLabels.length > 0
          ? deckLabels.map((deckLabel, index) => (
              <DeckLabel
                key={`DeckLabel_${index}`}
                maxWidth={`calc(${width}px - ${SPACING.spacing16})`}
                {...deckLabel}
                isLast={deckLabels.length - 1 === index}
              />
            ))
          : null}
      </LabelContainer>
    </RobotCoordsForeignDiv>
  )
}

export const DeckLabelSet = React.forwardRef<HTMLDivElement, DeckLabelSetProps>(
  DeckLabelSetComponent
)

const StyledBox = styled(Box)`
  border-radius: ${BORDERS.borderRadius4};
  border: 1.5px solid ${COLORS.blue50};
`

const LabelContainer = styled.div`
  padding-left: ${SPACING.spacing12};
  & > *:not(:first-child):not(:last-child) {
    border-bottom-right-radius: ${BORDERS.borderRadius4};
    border-top-right-radius: ${BORDERS.borderRadius4};
  }

  & > *:first-child {
    border-bottom-right-radius: ${BORDERS.borderRadius4};
  }

  & > *:last-child {
    border-bottom-left-radius: ${BORDERS.borderRadius4};
    border-bottom-right-radius: ${BORDERS.borderRadius4};
  }
`
