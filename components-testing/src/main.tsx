import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import { ProtocolDeck } from '@opentrons/components'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'
import {
  ProtocolVisualization,
  registerProtocolVisualizationI18n,
} from '@opentrons/protocol-visualization'

import './styles.css'

import StackerAnalysis from './StackerAnalysis.json'

import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'

const analysis = StackerAnalysis as unknown as ProtocolAnalysisOutput

i18next.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  resources: {},
})
registerProtocolVisualizationI18n(i18next)

type ActiveView = 'deck' | 'visualization'

function App(): JSX.Element {
  const [activeView, setActiveView] = useState<ActiveView>('visualization')

  return (
    <div className="app_container">
      <h1>Components Testing</h1>
      <p>
        Testing ProtocolDeck and ProtocolVisualization with StackerAnalysis data
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

      <div className="tab_bar">
        <button
          className={`tab_button ${activeView === 'deck' ? 'active' : ''}`}
          onClick={() => setActiveView('deck')}
        >
          ProtocolDeck
        </button>
        <button
          className={`tab_button ${activeView === 'visualization' ? 'active' : ''}`}
          onClick={() => setActiveView('visualization')}
        >
          ProtocolVisualization
        </button>
      </div>

      {activeView === 'deck' ? (
        <div
          data-testid="protocol-deck-container"
          className="protocol_deck_container"
        >
          <h2>ProtocolDeck Component:</h2>
          <ProtocolDeck
            protocolAnalysis={analysis as any}
            baseDeckProps={{
              showSlotLabels: true,
              showExpansion: true,
            }}
            showLabwareLabels
          />
        </div>
      ) : (
        <div
          data-testid="protocol-visualization-container"
          className="protocol_visualization_container"
        >
          <ProtocolVisualization
            analysis={analysis}
            protocolDisplayName={
              analysis.metadata.protocolName ?? 'Untitled Protocol'
            }
          />
        </div>
      )}
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
