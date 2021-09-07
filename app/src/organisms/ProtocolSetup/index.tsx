import * as React from 'react'

import { DIRECTION_COLUMN, SPACING_3, Flex } from '@opentrons/components'
import { RunSetupCard } from './RunSetupCard'
import { MetadataCard } from './MetadataCard'

export function ProtocolSetup(): JSX.Element {
  return (
    <Flex flexDirection={DIRECTION_COLUMN} padding={SPACING_3}>
      <MetadataCard />
      <RunSetupCard />
    </Flex>
  )
}
