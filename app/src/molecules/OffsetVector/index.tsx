import * as React from 'react'
import { Flex, SPACING, TYPOGRAPHY } from '@opentrons/components'
import { StyledText } from '../../atoms/text'

import type { StyleProps } from '@opentrons/components'

interface OffsetVectorProps extends StyleProps {
  x: number
  y: number
  z: number
  as?: React.ComponentProps<typeof StyledText>['as']
}

export function OffsetVector(props: OffsetVectorProps): JSX.Element {
  const { x, y, z, as = 'h6', ...styleProps } = props
  return (
    <Flex {...styleProps}>
      <StyledText
        as={as}
        marginRight={SPACING.spacing2}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
      >
        X
      </StyledText>
      <StyledText as={as} marginRight={SPACING.spacing3}>
        {x.toFixed(2)}
      </StyledText>
      <StyledText
        as={as}
        marginRight={SPACING.spacing2}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
      >
        Y
      </StyledText>
      <StyledText as={as} marginRight={SPACING.spacing3}>
        {y.toFixed(2)}
      </StyledText>
      <StyledText
        as={as}
        marginRight={SPACING.spacing2}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
      >
        Z
      </StyledText>
      <StyledText as={as} marginRight={SPACING.spacing3}>
        {z.toFixed(2)}
      </StyledText>
    </Flex>
  )
}
