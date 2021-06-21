import * as React from 'react'
import {
  Flex,
  C_NEAR_WHITE,
  DIRECTION_COLUMN,
  SPACING_3,
} from '@opentrons/components'

import { RunSetupCard } from './RunSetupCard'
import { MetadataCard } from './MetadataCard'

export function ProtocolSetup(): JSX.Element {
  return (
    <Flex
      height="100%"
      width="100%"
      backgroundColor={C_NEAR_WHITE}
      flexDirection={DIRECTION_COLUMN}
      padding={SPACING_3}
    >
      <MetadataCard />
      <RunSetupCard />
    </Flex>
  )
}
