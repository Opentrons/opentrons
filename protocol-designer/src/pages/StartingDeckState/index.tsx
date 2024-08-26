import * as React from 'react'
import { Flex, StyledText } from '@opentrons/components'

export function StartingDeckState(): JSX.Element {
  return (
    <Flex>
      <StyledText desktopStyle="displayBold">{'startingDeckState'}</StyledText>
    </Flex>
  )
}
