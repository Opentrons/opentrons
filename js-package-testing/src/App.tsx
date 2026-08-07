import { PrimaryButton, ProtocolDeck } from '@opentrons/components'
import { ProtocolVisualization } from '@opentrons/protocol-visualization'

import Ot2Analysis from './ot2Analysis.json'
import StackerAnalysis from './StackerAnalysis.json'

import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'

import './styles.css'

import { useState } from 'react'

const flexAnalysis = StackerAnalysis as unknown as ProtocolAnalysisOutput
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
    <div
      className={
        currentPage === 'protocol-visualization'
          ? 'app_container app_container_visualization'
          : 'app_container'
      }
    >
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
        From <code>@opentrons/components</code> using the same Flex and OT-2
        analysis fixtures as the protocol visualization page.
      </p>

      <div className="deck_map_grid">
        <DeckMapPanel
          testId="protocol-deck-flex"
          title="Flex"
          protocolFile="Flex_Smoke_2_27.py"
          analysisFile="StackerAnalysis.json"
          analysis={flexAnalysis}
        />
        <DeckMapPanel
          testId="protocol-deck-ot2"
          title="OT-2"
          protocolFile="OT2_Smoke_2_19.py"
          analysisFile="ot2Analysis.json"
          analysis={ot2Analysis}
        />
      </div>
    </main>
  )
}

interface DeckMapPanelProps {
  testId: string
  title: string
  protocolFile: string
  analysisFile: string
  analysis: ProtocolAnalysisOutput
}

function DeckMapPanel({
  testId,
  title,
  protocolFile,
  analysisFile,
  analysis,
}: DeckMapPanelProps): JSX.Element {
  return (
    <section className="deck_map_panel">
      <h3>{title}</h3>
      <p>
        <code>{protocolFile}</code> + <code>{analysisFile}</code>
      </p>
      <div className="analysis_info">
        <p>
          <strong>Protocol:</strong> {analysis.metadata?.protocolName ?? title}
        </p>
        <p>
          <strong>Robot type:</strong> {analysis.robotType}
        </p>
      </div>
      <div data-testid={testId} className="protocol_deck_container">
        <ProtocolDeck
          protocolAnalysis={analysis}
          baseDeckProps={{
            showSlotLabels: true,
            showExpansion: true,
          }}
          showLabwareLabels
        />
      </div>
    </section>
  )
}

function VisualizationPage(): JSX.Element {
  const [showFlex, setShowFlex] = useState<boolean>(true)
  return (
    <main className="demo_section protocol_visualization_section">
      <div className="protocol_visualization_toolbar">
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
        <p>
          {showFlex
            ? 'Flex: Flex_Smoke_2_27.py + StackerAnalysis.json'
            : 'OT-2: OT2_Smoke_2_19.py + ot2Analysis.json'}
        </p>
      </div>
      <div
        data-testid="protocol-visualization-container"
        className="protocol_visualization_demo"
      >
        <ProtocolVisualization
          analysis={showFlex ? flexAnalysis : ot2Analysis}
          groupedCommands={null}
          appType="web"
        />
      </div>
    </main>
  )
}
