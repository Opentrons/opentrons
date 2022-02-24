import * as React from 'react'
import { Flex, POSITION_ABSOLUTE, COLORS } from '@opentrons/components'

export function Veil(): JSX.Element {
  return (
    <Flex
      position={POSITION_ABSOLUTE}
      left="0"
      right="0"
      top="0"
      bottom="0"
      backgroundColor={COLORS.darkBlack}
      opacity={0.2}
    />
  )
}
