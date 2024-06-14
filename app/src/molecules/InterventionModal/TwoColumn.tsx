import * as React from 'react'

import { Flex, Box, DIRECTION_ROW, SPACING } from '@opentrons/components'

export interface TwoColumnProps {
  children: [React.ReactNode, React.ReactNode]
}

export function TwoColumn({
  children: [leftElement, rightElement],
}: TwoColumnProps): JSX.Element {
  return (
    <Flex flexDirection={DIRECTION_ROW} gap={SPACING.spacing40}>
      <Box flex={1}>{leftElement}</Box>
      <Box flex={1}>{rightElement}</Box>
    </Flex>
  )
}
