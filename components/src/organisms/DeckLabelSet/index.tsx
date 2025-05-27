import { forwardRef } from 'react'
import styled from 'styled-components'

import { RobotCoordsForeignDiv } from '../../hardware-sim'
import { BORDERS, COLORS } from '../../helix-design-system'
import { DeckInfoLabel } from '../../molecules'
import { DeckLabel } from '../../molecules/DeckLabel'
import { Box } from '../../primitives'
import { POSITION_ABSOLUTE, POSITION_RELATIVE } from '../../styles'
import { SPACING } from '../../ui-style-constants'

import type { ForwardedRef } from 'react'
import type { DeckLabelProps } from '../../molecules/DeckLabel'

interface DeckLabelSetProps {
  deckLabels: DeckLabelProps[]
  x: number
  y: number
  width: number
  height: number
  invert?: boolean
  showModuleIcon?: boolean
}

const DeckLabelSetComponent = (
  props: DeckLabelSetProps,
  ref: ForwardedRef<HTMLDivElement>
): JSX.Element => {
  const {
    deckLabels,
    x,
    y,
    width,
    height,
    invert = false,
    showModuleIcon = false,
  } = props

  return (
    <RobotCoordsForeignDiv
      x={x}
      y={y}
      innerDivProps={{
        style: {
          transform: `rotate(180deg) scaleX(-1) scaleY(${invert ? '-1' : '1'})`,
        },
      }}
    >
      <Box position={POSITION_RELATIVE} width="100%" height="100%">
        <StyledBox
          width={width}
          height={height}
          isZoomed={deckLabels.length > 0 ? deckLabels[0].isZoomed : true}
          data-testid="DeckLabeSet"
        />
        {showModuleIcon && (
          <IconWrapper leftPosition={width - 16}>
            <DeckInfoLabel
              iconName="stacked"
              highlight
              transform="scale(0.75)"
            />
          </IconWrapper>
        )}
        <LabelContainer ref={ref}>
          {deckLabels.length > 0
            ? deckLabels.map((deckLabel, index) => (
                <DeckLabel
                  key={`DeckLabel_${index}`}
                  maxWidth={`calc(${width}px - 8px)`}
                  {...deckLabel}
                  isLast={deckLabels.length - 1 === index}
                />
              ))
            : null}
        </LabelContainer>
      </Box>
    </RobotCoordsForeignDiv>
  )
}

export const DeckLabelSet = forwardRef<HTMLDivElement, DeckLabelSetProps>(
  DeckLabelSetComponent
)

interface StyledBoxProps {
  isZoomed: boolean
}

const StyledBox = styled(Box)<StyledBoxProps>`
  border-radius: ${BORDERS.borderRadius4};
  border: ${({ isZoomed }) =>
    isZoomed ? `1.5px solid ${COLORS.blue50}` : `3px solid ${COLORS.blue50}`};
`

const LabelContainer = styled.div`
  padding-left: ${SPACING.spacing8};
  & > *:not(:first-child):not(:last-child) {
    border-bottom-right-radius: ${BORDERS.borderRadius4};
    border-top-right-radius: ${BORDERS.borderRadius4};
  }

  & > *:first-child {
    border-bottom-right-radius: ${BORDERS.borderRadius4};
  }

  & > *:not(:first-child) {
    border-top-right-radius: ${BORDERS.borderRadius4};
    border-bottom-right-radius: ${BORDERS.borderRadius4};
  }

  & > *:last-child {
    border-bottom-left-radius: ${BORDERS.borderRadius4};
  }
`

interface IconWrapperProps {
  leftPosition: number
}

const IconWrapper = styled(Box)<IconWrapperProps>`
  position: ${POSITION_ABSOLUTE};
  top: -${SPACING.spacing8};
  left: ${props => `${props.leftPosition}px`};
  z-index: 3;
`
