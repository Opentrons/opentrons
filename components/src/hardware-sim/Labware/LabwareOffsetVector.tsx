import * as React from 'react'

import { Flex, Text } from '../../primitives'
import { SPACING, TYPOGRAPHY } from '../../ui-style-constants'

import type { StyleProps } from '../../primitives'

interface LabwareOffsetVectorProps extends StyleProps {
  x: number
  y: number
  z: number
}

export function LabwareOffsetVector(
  props: LabwareOffsetVectorProps
): JSX.Element {
  const { x, y, z, ...styleProps } = props
  return (
    <Flex {...styleProps}>
      <Text
        marginRight={SPACING.spacing4}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
      >
        X
      </Text>
      <Text marginRight={SPACING.spacing8}>{x.toFixed(2)}</Text>
      <Text
        marginRight={SPACING.spacing4}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
      >
        Y
      </Text>
      <Text marginRight={SPACING.spacing8}>{y.toFixed(2)}</Text>
      <Text
        marginRight={SPACING.spacing4}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
      >
        Z
      </Text>
      <Text marginRight={SPACING.spacing8}>{z.toFixed(2)}</Text>
    </Flex>
  )
}
