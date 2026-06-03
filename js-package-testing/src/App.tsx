import { PrimaryButton, ProtocolDeck } from '@opentrons/components'
import { ProtocolVisualization } from '@opentrons/protocol-visualization'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import Ot2Analysis from './ot2Analysis.json'
import StackerAnalysis from './StackerAnalysis.json'

import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'

import './styles.css'

import { useState } from 'react'

const analysis = StackerAnalysis as unknown as ProtocolAnalysisOutput
const ot2Analysis = Ot2Analysis as unknown as ProtocolAnalysisOutput

type DemoPage = 'deck-map' | 'protocol-visualization'

function getCurrentPage(): DemoPage {
  return window.location.pathname === '/protocol-visualization'
    ? 'protocol-visualization'
    : 'deck-map'
}

export function App(): JSX.Element {
  const currentPage = getCurrentPage()

  return (
    <div className="app_container">
      <header className="demo_header">
        <h1>JS package testing</h1>
        <p className="demo_lead">
          Local packed builds of <code>@opentrons/components</code>,{' '}
          <code>@opentrons/shared-data</code>,{' '}
          <code>@opentrons/step-generation</code>, and{' '}
          <code>@opentrons/protocol-visualization</code>.
        </p>
        <nav className="demo_nav" aria-label="Demo pages">
          <a
            href="/deck-map"
            aria-current={currentPage === 'deck-map' ? 'page' : undefined}
          >
            Deck map
          </a>
          <a
            href="/protocol-visualization"
            aria-current={
              currentPage === 'protocol-visualization' ? 'page' : undefined
            }
          >
            Protocol visualization
          </a>
        </nav>
      </header>

      {currentPage === 'deck-map' ? <DeckMapPage /> : <VisualizationPage />}
    </div>
  )
}

function DeckMapPage(): JSX.Element {
  return (
    <main className="demo_section">
      <h2>Deck map</h2>
      <p>
        From <code>@opentrons/components</code> using the same StackerAnalysis
        fixture as the protocol visualization page.
      </p>

      <div className="analysis_info">
        <h3>Analysis</h3>
        <p>
          <strong>Protocol:</strong>{' '}
          {analysis.metadata?.protocolName ?? 'ot-2 protocol'}
        </p>
        <p>
          <strong>Robot type:</strong> {analysis.robotType}
        </p>
        <p>
          <strong>FLEX_ROBOT_TYPE:</strong> {FLEX_ROBOT_TYPE}
        </p>
      </div>
      <div
        data-testid="protocol-deck-container"
        className="protocol_deck_container"
      >
        <h3>ProtocolDeck</h3>
        <ProtocolDeck
          protocolAnalysis={analysis}
          baseDeckProps={{
            showSlotLabels: true,
            showExpansion: true,
          }}
          showLabwareLabels
        />
      </div>
    </main>
  )
}

function VisualizationPage(): JSX.Element {
  const [showFlex, setShowFlex] = useState<boolean>(true)
  return (
    <main className="demo_section protocol_visualization_section">
      <h2>Protocol visualization</h2>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <PrimaryButton
          onClick={() => {
            setShowFlex(true)
          }}
        >
          Flex
        </PrimaryButton>
        <PrimaryButton
          onClick={() => {
            setShowFlex(false)
          }}
        >
          Ot-2
        </PrimaryButton>
      </div>
      <p>
        From <code>@opentrons/protocol-visualization</code> using the{' '}
        {showFlex ? 'StackerAnalysis' : 'Ot2Analysis'} fixture as the deck map
        page.
      </p>
      <div
        data-testid="protocol-visualization-container"
        className="protocol_visualization_demo"
      >
        <ProtocolVisualization
          analysis={showFlex ? analysis : ot2Analysis}
          groupedCommands={null}
        />
      </div>
    </main>
  )
}
