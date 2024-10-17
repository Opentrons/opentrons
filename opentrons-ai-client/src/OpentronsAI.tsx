import { HashRouter } from 'react-router-dom'
import { DIRECTION_COLUMN, Flex, OVERFLOW_AUTO } from '@opentrons/components'
import { OpentronsAIRoutes } from './OpentronsAIRoutes'

export function OpentronsAI(): JSX.Element {
  return (
    <div
      id="opentrons-ai"
      style={{ width: '100%', height: '100vh', overflow: OVERFLOW_AUTO }}
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <HashRouter>
          <OpentronsAIRoutes />
        </HashRouter>
      </Flex>
    </div>
  )
}
