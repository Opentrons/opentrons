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
    <div style={{ padding: '1rem' }}>
      <h1>ProtocolDeck Testing</h1>
      <p>
        Testing ProtocolDeck component with StackerAnalysis data (minimal setup)
      </p>

      <div
        style={{
          padding: '1rem',
          backgroundColor: '#f0f0f0',
          marginTop: '1rem',
          marginBottom: '1rem',
        }}
      >
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
        style={{
          padding: '1rem',
          backgroundColor: '#fff',
          border: '1px solid #ccc',
          borderRadius: '8px',
          marginTop: '1rem',
        }}
      >
        <h2>ProtocolDeck Component:</h2>
        <ProtocolDeck
          protocolAnalysis={analysis as any}
          baseDeckProps={{
            showSlotLabels: true,
            svgProps: {
              style: { width: '100%', height: 'auto', maxWidth: '1000px' },
            },
          }}
        />
      </div>
    </div>
  )
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}
const root = createRoot(rootElement)

root.render(
  <StrictMode>
    <App />
  </StrictMode>
)
