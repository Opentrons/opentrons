import React from 'react'
import { DIRECTION_ROW, Flex, StyledText } from '@opentrons/components'

import { SidePanel } from './molecules/SidePanel'
import { PromptGuide } from './molecules/PromptGuide'

export function App(): JSX.Element {
  return (
    <Flex flexDirection={DIRECTION_ROW}>
      <SidePanel />
    </Flex>
  )
}
