import {
  Flex,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import type { ComponentProps, ReactNode } from 'react'
import type { StyleProps } from '@opentrons/components'

interface LegacyOffsetVectorProps extends StyleProps {
  x: number
  y: number
  z: number
  as?: ComponentProps<typeof LegacyStyledText>['as']
}

export function LegacyOffsetVector(props: LegacyOffsetVectorProps): ReactNode {
  const { x, y, z, as = 'h6', ...styleProps } = props
  return (
    <Flex {...styleProps}>
      <LegacyStyledText
        forwardedAs={as}
        marginRight={SPACING.spacing4}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
      >
        X
      </LegacyStyledText>
      <LegacyStyledText forwardedAs={as} marginRight={SPACING.spacing8}>
        {x.toFixed(1)}
      </LegacyStyledText>
      <LegacyStyledText
        forwardedAs={as}
        marginRight={SPACING.spacing4}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
      >
        Y
      </LegacyStyledText>
      <LegacyStyledText forwardedAs={as} marginRight={SPACING.spacing8}>
        {y.toFixed(1)}
      </LegacyStyledText>
      <LegacyStyledText
        forwardedAs={as}
        marginRight={SPACING.spacing4}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
      >
        Z
      </LegacyStyledText>
      <LegacyStyledText forwardedAs={as} marginRight={SPACING.spacing8}>
        {z.toFixed(1)}
      </LegacyStyledText>
    </Flex>
  )
}
