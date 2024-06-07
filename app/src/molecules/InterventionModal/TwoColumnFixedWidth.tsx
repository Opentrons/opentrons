import * as React from 'react'

import { Flex, Box, DIRECTION_ROW, SPACING } from '@opentrons/components'

export interface TwoColumnFixedWidthProps {
  children: [React.ReactNode, React.ReactNode]
}

export function TwoColumnFixedWidth({
  children: [leftElement, rightElement],
}: TwoColumnFixedWidthProps): JSX.Element {
  return (
    <Flex flexDirection={DIRECTION_ROW} gap={SPACING.spacing48}>
      {leftElement}
      <Box minWidth={'426px'}>{rightElement}</Box>
    </Flex>
  )
}
