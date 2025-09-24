import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { ProtocolDeck } from '@opentrons/components'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import './styles.css'

// Import the analysis data
import StackerAnalysis from './StackerAnalysis.json'

import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'

const analysis = (StackerAnalysis as unknown) as ProtocolAnalysisOutput

function App(): JSX.Element {
  return (
    <div className="app_container">
      <h1>ProtocolDeck Testing</h1>
      <p>
        Testing ProtocolDeck component with StackerAnalysis data (minimal setup)
      </p>

      <div className="analysis_info">
        <h2>Analysis Info:</h2>
        <p>
          <strong>Protocol:</strong> {analysis.metadata.protocolName}
        </p>
        <p>
          <strong>Robot Type:</strong> {analysis.robotType}
        </p>
        <p>
          <strong>FLEX_ROBOT_TYPE:</strong> {FLEX_ROBOT_TYPE}
        </p>
      </div>

      <div
        data-testid="protocol-deck-container"
        className="protocol_deck_container"
      >
        <h2>ProtocolDeck Component:</h2>
        <ProtocolDeck
          protocolAnalysis={analysis as any}
          baseDeckProps={{
            showSlotLabels: true,
          }}
        />
      </div>
    </div>
  )
}

const rootElement = document.getElementById('root')
if (rootElement == null) {
  throw new Error('Root element not found')
}
const root = createRoot(rootElement)

root.render(
  <StrictMode>
    <App />
  </StrictMode>
)
