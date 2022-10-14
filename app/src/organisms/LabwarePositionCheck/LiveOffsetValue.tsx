import * as React from 'react'
import { Flex, Icon, SIZE_1, SPACING, ALIGN_CENTER, TYPOGRAPHY } from '@opentrons/components'
import { StyledText } from '../../atoms/text'

import type { StyleProps } from '@opentrons/components'

interface OffsetVectorProps extends StyleProps {
  x: number
  y: number
  z: number
}

export function LiveOffsetValue(props: OffsetVectorProps): JSX.Element {
  const { x, y, z, ...styleProps } = props
  const axisLabels = ['X', 'Y', 'Z']
  return (
    <Flex alignItems={ALIGN_CENTER} {...styleProps}>
      <Icon name="reticle" size={SIZE_1} />
      {[x, y, z].map((axis, index) => (
        <>
          <StyledText as='p' fontWeight={TYPOGRAPHY.fontWeightSemiBold}>{axisLabels[index]}</StyledText>
          <StyledText as='p'>{axis.toFixed(1)}</StyledText>
        </>
      ))}
    </Flex>
  )
}
