import * as React from 'react'
import { Flex, SPACING } from '@opentrons/components'
import { StyledText } from '../../atoms/text'

import type { StyleProps } from '@opentrons/components'

interface OffsetVectorProps extends StyleProps {
  x: number
  y: number
  z: number
}

export function OffsetVector(props: OffsetVectorProps): JSX.Element {
  const { x, y, z, ...styleProps } = props
  return (
    <Flex {...styleProps}>
      <StyledText as={'h6'} marginRight={SPACING.spacing2}>
        X
      </StyledText>
      <StyledText as={'h6'} marginRight={SPACING.spacing3}>
        {x.toFixed(2)}
      </StyledText>
      <StyledText as={'h6'} marginRight={SPACING.spacing2}>
        Y
      </StyledText>
      <StyledText as={'h6'} marginRight={SPACING.spacing3}>
        {y.toFixed(2)}
      </StyledText>
      <StyledText as={'h6'} marginRight={SPACING.spacing2}>
        Z
      </StyledText>
      <StyledText as={'h6'} marginRight={SPACING.spacing3}>
        {z.toFixed(2)}
      </StyledText>
    </Flex>
  )
}
