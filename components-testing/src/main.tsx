import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { Box, ProtocolDeck } from '@opentrons/components'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import StackerAnalysis from './StackerAnalysis.json'

import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'

const analysis = (StackerAnalysis as unknown) as ProtocolAnalysisOutput

function App() {
  return (
    <div style={{ padding: '1rem' }}>
      <h1>ProtocolDeck Testing</h1>
      <p>Testing ProtocolDeck component with StackerAnalysis data</p>
      <Box
        padding="1rem"
        backgroundColor="#f0f0f0"
        marginTop="1rem"
        marginBottom="1rem"
      >
        <h2>Package Info:</h2>
        <p>
          <strong>@opentrons/shared-data:</strong> FLEX_ROBOT_TYPE ={' '}
          {FLEX_ROBOT_TYPE}
        </p>
        <p>
          <strong>@opentrons/components:</strong> ProtocolDeck component
          imported successfully!
        </p>
        <p>
          <strong>Analysis data:</strong> Protocol "
          {analysis.metadata.protocolName}" for {analysis.robotType}
        </p>
      </Box>
      <Box
        padding="1rem"
        backgroundColor="#fff"
        border="1px solid #ccc"
        borderRadius="8px"
      >
        <ProtocolDeck
          protocolAnalysis={analysis as any}
          baseDeckProps={{
            showSlotLabels: true,
            svgProps: {
              style: { width: '100%', height: 'auto', maxWidth: '1000px' },
            },
          }}
        />
      </Box>
    </div>
  )
}

const rootElement = document.getElementById('root')!
const root = createRoot(rootElement)

root.render(
  <StrictMode>
    <App />
  </StrictMode>
)
