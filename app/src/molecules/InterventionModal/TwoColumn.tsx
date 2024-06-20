import * as React from 'react'

import { Flex, Box, DIRECTION_ROW, SPACING, WRAP } from '@opentrons/components'

export interface TwoColumnProps {
  children: [React.ReactNode, React.ReactNode]
}

export function TwoColumn({
  children: [leftElement, rightElement],
}: TwoColumnProps): JSX.Element {
  return (
    <Flex flexDirection={DIRECTION_ROW} gap={SPACING.spacing40} flexWrap={WRAP}>
      <Box flex="1" minWidth="17.1875rem">
        {leftElement}
      </Box>
      <Box flex="1" minWidth="275px">
        {rightElement}
      </Box>
    </Flex>
  )
}
