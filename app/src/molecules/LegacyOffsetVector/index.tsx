import { Flex, SPACING, StyledText, TYPOGRAPHY } from '@opentrons/components'

import type { ComponentProps, ReactNode } from 'react'
import type { StyleProps } from '@opentrons/components'

interface LegacyOffsetVectorProps extends StyleProps {
  x: number
  y: number
  z: number
  as?: ComponentProps<typeof StyledText>['as']
}

export function LegacyOffsetVector(props: LegacyOffsetVectorProps): ReactNode {
  const { x, y, z, as = 'h6', ...styleProps } = props
  return (
    <Flex {...styleProps}>
      <StyledText
        forwardedAs={as}
        marginRight={SPACING.spacing4}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
      >
        X
      </StyledText>
      <StyledText forwardedAs={as} marginRight={SPACING.spacing8}>
        {x.toFixed(1)}
      </StyledText>
      <StyledText
        forwardedAs={as}
        marginRight={SPACING.spacing4}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
      >
        Y
      </StyledText>
      <StyledText forwardedAs={as} marginRight={SPACING.spacing8}>
        {y.toFixed(1)}
      </StyledText>
      <StyledText
        forwardedAs={as}
        marginRight={SPACING.spacing4}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
      >
        Z
      </StyledText>
      <StyledText forwardedAs={as} marginRight={SPACING.spacing8}>
        {z.toFixed(1)}
      </StyledText>
    </Flex>
  )
}
