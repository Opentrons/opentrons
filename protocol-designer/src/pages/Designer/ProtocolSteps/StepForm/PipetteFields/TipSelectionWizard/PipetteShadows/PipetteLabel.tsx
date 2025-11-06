import { forwardRef } from 'react'
import { css } from 'styled-components'

import {
  COLORS,
  Flex,
  FLEX_MAX_CONTENT,
  RobotCoordsForeignDiv,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { getBorderPropsForPlacement } from '../utils'

import type { ForwardedRef } from 'react'
import type { LabelPlacement } from '../types'

export interface PipetteLabelProps {
  text: string
  x: number
  y: number
  placement: LabelPlacement
  isZoomed: boolean
  isError: boolean
}

function PipetteLabelComponent(
  { text, isZoomed, isError, x, y, placement }: PipetteLabelProps,
  ref: ForwardedRef<HTMLDivElement>
): JSX.Element {
  const PIPETTE_LABEL_BASE_STYLE = css`
    width: ${FLEX_MAX_CONTENT};
    padding: ${SPACING.spacing2};
    background-color: ${COLORS.white};
    ${getBorderPropsForPlacement(placement, isError)}
  `
  const PIPETTE_LABEL_ACCESSIBLE_STYLE = css`
    ${PIPETTE_LABEL_BASE_STYLE}
    color: ${COLORS.blue50};
  `

  const PIPETTE_LABEL_INACCESSIBLE_STYLE = css`
    ${PIPETTE_LABEL_BASE_STYLE}
    color: ${COLORS.red50};
  `

  return (
    <RobotCoordsForeignDiv
      x={x}
      y={y}
      innerDivProps={{
        transform: `rotate(180deg) scaleX(-1)`,
      }}
    >
      <Flex
        ref={ref}
        fontSize={isZoomed ? '5px' : '13px'}
        data-testid={`PipetteLabel_${isError ? 'Inaccessible' : 'Accessible'}`}
        css={
          isError
            ? PIPETTE_LABEL_INACCESSIBLE_STYLE
            : PIPETTE_LABEL_ACCESSIBLE_STYLE
        }
      >
        <StyledText color={isError ? COLORS.red50 : COLORS.blue50}>
          {text}
        </StyledText>
      </Flex>
    </RobotCoordsForeignDiv>
  )
}

export const PipetteLabel = forwardRef<HTMLDivElement, PipetteLabelProps>(
  PipetteLabelComponent
)
