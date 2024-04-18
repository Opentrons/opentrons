import React from 'react'
import { DIRECTION_ROW, Flex } from '@opentrons/components'

import { SidePanel } from './molecules/SidePanel'
import { ChatContainer } from './organisms/ChatContainer'

export function App(): JSX.Element {
  return (
    <Flex flexDirection={DIRECTION_ROW}>
      <SidePanel />
      <ChatContainer />
    </Flex>
  )
}
