import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { HashRouter } from 'react-router-dom'

import {
  Box,
  DIRECTION_COLUMN,
  Flex,
  OVERFLOW_AUTO,
} from '@opentrons/components'

import { PortalRoot } from './components/organisms'
import { ProtocolRoutes } from './ProtocolRoutes'

import type { ReactNode } from 'react'

export function ProtocolEditor(): ReactNode {
  return (
    <DndProvider backend={HTML5Backend}>
      <Box
        width="100%"
        height="100vh"
        overflow={OVERFLOW_AUTO}
        id="protocol-editor"
      >
        <PortalRoot />
        <Flex flexDirection={DIRECTION_COLUMN} height="100%">
          <HashRouter>
            <ProtocolRoutes />
          </HashRouter>
        </Flex>
      </Box>
    </DndProvider>
  )
}
