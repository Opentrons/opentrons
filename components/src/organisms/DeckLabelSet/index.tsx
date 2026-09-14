import { forwardRef } from 'react'
import styled from 'styled-components'

import { RobotCoordsForeignDiv } from '../../hardware-sim'
import { BORDERS, COLORS } from '../../helix-design-system'
import { RobotInfoLabel } from '../../molecules'
import { DeckLabel } from '../../molecules/DeckLabel'
import { Box } from '../../primitives'
import { POSITION_ABSOLUTE, POSITION_RELATIVE } from '../../styles'
import { SPACING } from '../../ui-style-constants'

import type { ForwardedRef, ReactNode } from 'react'
import type { DeckLabelProps } from '../../molecules/DeckLabel'

interface DeckLabelSetProps {
  deckLabels: DeckLabelProps[]
  x: number
  y: number
  width: number
  height: number
  invert?: boolean
  showModuleIcon?: boolean
  showBorder?: boolean
}
//  +15/30 to leave room for the deck info label to be fully visible in the viewbox
const WIDTH_ADJUSTED = 15
const HEIGHT_ADJUSTED = 30

const DeckLabelSetComponent = (
  props: DeckLabelSetProps,
  ref: ForwardedRef<HTMLDivElement>
): ReactNode => {
  const {
    deckLabels,
    x,
    y,
    width,
    height,
    invert = false,
    showModuleIcon = false,
    showBorder = true,
  } = props

  return (
    <RobotCoordsForeignDiv
      x={x}
      y={y}
      width={width + WIDTH_ADJUSTED}
      height={height + HEIGHT_ADJUSTED}
      innerDivProps={{
        transform: `rotate(180deg) scaleX(-1) scaleY(${invert ? '-1' : '1'})`,
      }}
    >
      <Box position={POSITION_RELATIVE} width="100%" height="100%">
        <StyledBox
          width={width}
          height={height}
          $isZoomed={deckLabels.length > 0 ? deckLabels[0].isZoomed : true}
          data-testid="DeckLabeSet"
          $showBorder={showBorder}
        />
        {showModuleIcon && (
          <IconWrapper leftPosition={width - 16}>
            <RobotInfoLabel
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
  $isZoomed: boolean
  $showBorder: boolean
}

const StyledBox = styled(Box)<StyledBoxProps>`
  border-radius: ${BORDERS.borderRadius4};
  border: ${({ $isZoomed, $showBorder }) => {
    if (!$showBorder) {
      return 'none'
    }
    const width = $isZoomed ? '1.5px' : '3px'
    return `${width} solid ${COLORS.blue50}`
  }};
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
